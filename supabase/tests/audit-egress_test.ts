import {
  denoEgress,
  type EgressIO,
  isPublicIP,
  publicURL,
  safeFetchHTML,
  type Wire,
} from "../functions/_shared/safe-fetch.ts";
function assert(v: unknown, message = "assertion failed"): asserts v {
  if (!v) throw Error(message);
}
async function rejects(fn: () => unknown, pattern: RegExp) {
  try {
    await fn();
  } catch (e) {
    assert(pattern.test(String(e)), String(e));
    return;
  }
  throw Error("expected rejection");
}
function fixture(responses: string[], ips = ["93.184.216.34"]) {
  const calls: string[] = [], requests: string[] = [];
  let closed = 0;
  const io: EgressIO = {
    resolve: async () => ips,
    connect: async (ip, host) => {
      calls.push(`${ip}|${host}`);
      let bytes = new TextEncoder().encode(responses.shift() || "");
      const wire: Wire = {
        read: async (p) => {
          if (!bytes.length) return null;
          const n = Math.min(p.length, bytes.length, 17);
          p.set(bytes.subarray(0, n));
          bytes = bytes.slice(n);
          return n;
        },
        write: async (p) => {
          requests.push(new TextDecoder().decode(p));
          return p.length;
        },
        close: () => {
          closed++;
        },
      };
      return wire;
    },
  };
  return {
    io,
    calls,
    requests,
    get closed() {
      return closed;
    },
  };
}
Deno.test("production connector pins TCP, preserves TLS SNI/cert hostname and fails closed", async () => {
  const connect = Deno.connect, startTls = Deno.startTls;
  let closed = 0, handshakes = 0;
  const tcp = {
    close() {
      closed++;
    },
  } as Deno.TcpConn;
  const tls = {
    close() {
      closed++;
    },
    handshake: async () => {
      handshakes++;
    },
  } as unknown as Deno.TlsConn;
  try {
    Deno.connect = ((options: Deno.ConnectOptions) => {
      assert(options.hostname === "93.184.216.34" && options.port === 443);
      return Promise.resolve(tcp);
    }) as typeof Deno.connect;
    Deno.startTls = (conn, options) => {
      assert(conn === tcp);
      assert(options?.hostname === "example.com");
      assert(!options.unsafelyDisableHostnameVerification);
      assert(options.alpnProtocols?.[0] === "http/1.1");
      return Promise.resolve(tls);
    };
    const wire = await denoEgress.connect(
      "93.184.216.34",
      "example.com",
      new AbortController().signal,
    );
    assert(handshakes === 1);
    wire.close();
    assert(closed === 1);
    Deno.startTls = () =>
      Promise.reject(new Deno.errors.NotSupported("unsupported"));
    await rejects(
      () =>
        denoEgress.connect(
          "93.184.216.34",
          "example.com",
          new AbortController().signal,
        ),
      /configured SSRF-filtering proxy/,
    );
  } finally {
    Deno.connect = connect;
    Deno.startTls = startTls;
  }
});
const html =
  '<html><meta name="theme-color" content="#ab1234"><title>Brand</title></html>';
const ok =
  `HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: ${html.length}\r\n\r\n${html}`;
Deno.test("reject localhost, integer/hex IPv4, private IPv6 and unsafe URL forms", async () => {
  for (
    const url of [
      "https://localhost/",
      "https://2130706433/",
      "https://0x7f000001/",
      "https://127.1/",
      "https://[::1]/",
      "https://[::ffff:127.0.0.1]/",
      "https://[fc00::1]/",
      "https://[fe80::1]/",
      "https://169.254.169.254/",
      "https://10.0.0.1/",
      "http://example.com/",
      "https://user:pass@example.com/",
      "https://example.com:8443/",
    ]
  ) await rejects(() => publicURL(url), /allowed/);
  for (
    const ip of [
      "0.0.0.0",
      "100.64.0.1",
      "192.0.0.1",
      "198.19.0.1",
      "224.0.0.1",
      "2001:db8::1",
      "2002:7f00:1::",
      "2001::1",
      "3fff::1",
    ]
  ) assert(!isPublicIP(ip), ip);
  assert(isPublicIP("2606:4700:4700::1111"));
});
Deno.test("normal public HTTPS HTML preserved; numeric pin and original Host", async () => {
  const f = fixture([ok]);
  const result = await safeFetchHTML("https://example.com/brand?q=1", {
    io: f.io,
  });
  assert(result.html === html);
  assert(f.calls[0] === "93.184.216.34|example.com");
  assert(f.requests[0].includes("Host: example.com\r\n"));
  assert(f.closed === 1);
});
Deno.test("resolved private or mixed DNS answers never connect", async () => {
  for (
    const ips of [["10.0.0.1"], ["93.184.216.34", "::1"], ["::ffff:a00:1"], []]
  ) {
    const f = fixture([ok], ips);
    await rejects(
      () => safeFetchHTML("https://example.com", { io: f.io }),
      /non-public/,
    );
    assert(!f.calls.length);
  }
});
Deno.test("redirect destinations revalidated and public relative redirects work", async () => {
  for (
    const location of [
      "https://127.0.0.1",
      "https://[::1]",
      "http://example.com",
    ]
  ) {
    const f = fixture([
      `HTTP/1.1 302 Found\r\nLocation: ${location}\r\n\r\n`,
      ok,
    ]);
    await rejects(
      () => safeFetchHTML("https://example.com", { io: f.io }),
      /allowed/,
    );
    assert(f.calls.length === 1);
  }
  const f = fixture(["HTTP/1.1 302 Found\r\nLocation: /new\r\n\r\n", ok]);
  assert(
    (await safeFetchHTML("https://example.com", { io: f.io })).url.pathname ===
      "/new",
  );
  assert(f.calls.length === 2);
  const loop = fixture(
    Array(5).fill("HTTP/1.1 302 Found\r\nLocation: /again\r\n\r\n"),
  );
  await rejects(
    () => safeFetchHTML("https://example.com", { io: loop.io }),
    /Too many/,
  );
});
Deno.test("rebinding on redirect is rejected before second connection", async () => {
  const f = fixture(["HTTP/1.1 302 Found\r\nLocation: /again\r\n\r\n"]);
  let count = 0;
  f.io.resolve = async () => ++count === 1 ? ["93.184.216.34"] : ["127.0.0.1"];
  await rejects(
    () => safeFetchHTML("https://example.com", { io: f.io }),
    /non-public/,
  );
  assert(f.calls.length === 1);
});
Deno.test("bounded content-length, streaming and chunked bodies; chunked success", async () => {
  for (
    const response of [
      ok,
      "HTTP/1.1 200 OK\r\n\r\n" + "x".repeat(100),
      "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n64\r\n" +
      "x".repeat(100) + "\r\n0\r\n\r\n",
    ]
  ) {
    const f = fixture([response]);
    await rejects(
      () => safeFetchHTML("https://example.com", { io: f.io, maxBytes: 20 }),
      /too large/,
    );
    assert(f.closed === 1);
  }
  const f = fixture([
    "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nhello\r\n0\r\n\r\n",
  ]);
  assert(
    (await safeFetchHTML("https://example.com", { io: f.io })).html === "hello",
  );
});
Deno.test("total deadline covers DNS, connect and stalled body, closes socket", async () => {
  const never = () => new Promise<never>(() => {});
  for (const phase of ["dns", "connect", "body"]) {
    let closed = false;
    const io: EgressIO = {
      resolve: phase === "dns" ? never : async () => ["93.184.216.34"],
      connect: phase === "connect" ? never : async () => ({
        read: never,
        write: async (p) => p.length,
        close: () => {
          closed = true;
        },
      }),
    };
    await rejects(
      () => safeFetchHTML("https://example.com", { io, timeoutMs: 10 }),
      /timed out/,
    );
    if (phase === "body") assert(closed);
  }
});
