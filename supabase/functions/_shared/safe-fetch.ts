// DNS is resolved once, then TCP connects to a validated literal address.
// TLS still verifies the ORIGINAL hostname; fetch() must not re-resolve it.
// Deno docs: https://docs.deno.com/api/deno/~/Deno.startTls
export class SafeFetchError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}
export interface Wire {
  read(p: Uint8Array): Promise<number | null>;
  write(p: Uint8Array): Promise<number>;
  close(): void;
}
export interface EgressIO {
  resolve(host: string): Promise<string[]>;
  connect(ip: string, host: string, signal: AbortSignal): Promise<Wire>;
}
function close(c?: { close(): void }) {
  try {
    c?.close();
  } catch { /* already closed */ }
}
export const denoEgress: EgressIO = {
  async resolve(host) {
    const answers = await Promise.all(["A", "AAAA"].map(async (type) => {
      try {
        return await Deno.resolveDns(host, type as "A" | "AAAA");
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) return [];
        throw e;
      }
    }));
    return answers.flat();
  },
  async connect(ip, host, signal) {
    let conn: Deno.TcpConn | Deno.TlsConn | undefined;
    const abort = () => close(conn);
    signal.addEventListener("abort", abort, { once: true });
    try {
      signal.throwIfAborted();
      conn = await Deno.connect({ hostname: ip, port: 443 });
      signal.throwIfAborted();
      conn = await Deno.startTls(conn, {
        hostname: host,
        alpnProtocols: ["http/1.1"],
      });
      signal.throwIfAborted();
      await conn.handshake();
      return {
        read: (p) => conn!.read(p),
        write: (p) => conn!.write(p),
        close() {
          signal.removeEventListener("abort", abort);
          close(conn);
        },
      };
    } catch (e) {
      signal.removeEventListener("abort", abort);
      close(conn);
      if (
        e instanceof Deno.errors.NotSupported ||
        typeof Deno.startTls !== "function"
      ) {
        throw new SafeFetchError(
          "Secure TLS egress unavailable: this runtime requires a configured SSRF-filtering proxy or socket-capable runtime",
          503,
        );
      }
      throw e;
    }
  },
};

export function isPublicIP(raw: string): boolean {
  const ip = raw.replace(/^\[|\]$/g, "").toLowerCase();
  if (ip.includes(":")) {
    // Only global-unicast 2000::/3; exclude special-purpose, documentation,
    // Teredo and 6to4 (which can encode private IPv4 destinations).
    let normalized: string;
    try {
      normalized = new URL(`https://[${ip}]/`).hostname.slice(1, -1);
    } catch {
      return false;
    }
    const first = parseInt(normalized.split(":")[0], 16);
    return first >= 0x2000 && first <= 0x3fff &&
      !/^2001:(?:[01]?[0-9a-f]{0,2}:|db8:)/.test(normalized) &&
      !normalized.startsWith("2002:") && !normalized.startsWith("3fff:");
  }
  const parts = ip.split(".");
  if (
    parts.length !== 4 || parts.some((v) => !/^\d{1,3}$/.test(v) || +v > 255)
  ) return false;
  const [a, b, c] = parts.map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}
export function publicURL(input: unknown): URL {
  if (typeof input !== "string" || input.length > 4096) {
    throw new SafeFetchError("Invalid URL");
  }
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SafeFetchError("Invalid URL");
  }
  if (
    url.protocol !== "https:" || url.username || url.password ||
    (url.port && url.port !== "443")
  ) {
    throw new SafeFetchError("Only public HTTPS URLs on port 443 are allowed");
  }
  const host = url.hostname.replace(/\.$/, "").toLowerCase();
  if (!host.includes(".") && !host.includes(":")) {
    throw new SafeFetchError("Internal host not allowed");
  }
  if (
    /(^|\.)(localhost|local|internal|test|invalid|onion)$/.test(host) ||
    ((host.includes(":") || /^[\d.]+$/.test(host)) && !isPublicIP(host))
  ) {
    throw new SafeFetchError("Internal host not allowed");
  }
  url.hostname = host;
  url.hash = "";
  return url;
}

// Deliberately small HTTP/1.1 GET reader: no pooling, compression or cookies.
// Wire bytes (including chunk framing) and headers have independent hard caps.
async function exchange(conn: Wire, url: URL, maxBytes: number) {
  const request = new TextEncoder().encode(
    `GET ${url.pathname}${url.search} HTTP/1.1\r\nHost: ${url.host}\r\nUser-Agent: BrandExtractor/1.0\r\nAccept: text/html,application/xhtml+xml\r\nAccept-Encoding: identity\r\nConnection: close\r\n\r\n`,
  );
  for (let i = 0; i < request.length;) {
    const n = await conn.write(request.subarray(i));
    if (n <= 0) throw new SafeFetchError("Write failed", 502);
    i += n;
  }
  let buffer = new Uint8Array(0), wireBytes = 0;
  async function more() {
    const chunk = new Uint8Array(16384), n = await conn.read(chunk);
    if (n === null) return false;
    wireBytes += n;
    if (wireBytes > maxBytes + 65536) {
      throw new SafeFetchError("Website response too large", 413);
    }
    const next = new Uint8Array(buffer.length + n);
    next.set(buffer);
    next.set(chunk.subarray(0, n), buffer.length);
    buffer = next;
    return true;
  }
  async function line(): Promise<string> {
    for (;;) {
      const i = buffer.findIndex((v, i) => v === 13 && buffer[i + 1] === 10);
      if (i >= 0) {
        if (i > 8192) throw new SafeFetchError("HTTP line too large", 502);
        const text = new TextDecoder().decode(buffer.subarray(0, i));
        buffer = buffer.slice(i + 2);
        return text;
      }
      if (buffer.length > 8192 || !await more()) {
        throw new SafeFetchError("Invalid HTTP response", 502);
      }
    }
  }
  const statusLine = await line(),
    match = /^HTTP\/1\.[01] (\d{3})(?: |$)/.exec(statusLine);
  if (!match) throw new SafeFetchError("Invalid HTTP response", 502);
  const status = +match[1], headers = new Headers();
  let headerBytes = 0;
  for (;;) {
    const text = await line();
    if (!text) break;
    headerBytes += text.length + 2;
    if (headerBytes > 32768) {
      throw new SafeFetchError("HTTP headers too large", 502);
    }
    const at = text.indexOf(":");
    if (at <= 0 || /^[ \t]/.test(text)) {
      throw new SafeFetchError("Invalid HTTP header", 502);
    }
    headers.append(text.slice(0, at), text.slice(at + 1).trim());
  }
  if ([301, 302, 303, 307, 308].includes(status)) {
    return { status, headers, html: "" };
  }
  if (status < 200 || status >= 300) {
    throw new SafeFetchError("Website returned an error", 502);
  }
  if (
    !/^(text\/html|application\/xhtml\+xml)(?:;|$)/i.test(
      headers.get("content-type") || "text/html",
    )
  ) throw new SafeFetchError("Website is not HTML", 415);
  if (
    headers.has("content-encoding") &&
    headers.get("content-encoding") !== "identity"
  ) throw new SafeFetchError("Unsupported website encoding", 502);
  const length = headers.get("content-length"),
    transfer = headers.get("transfer-encoding");
  if (
    (transfer && transfer.toLowerCase() !== "chunked") ||
    (transfer && length) || (length !== null && !/^\d+$/.test(length))
  ) throw new SafeFetchError("Invalid HTTP framing", 502);
  if (length !== null && +length > maxBytes) {
    throw new SafeFetchError("Website response too large", 413);
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  function add(bytes: Uint8Array) {
    total += bytes.length;
    if (total > maxBytes) {
      throw new SafeFetchError("Website response too large", 413);
    }
    chunks.push(bytes);
  }
  async function take(size: number) {
    while (size) {
      if (!buffer.length && !await more()) {
        throw new SafeFetchError("Truncated website response", 502);
      }
      const n = Math.min(size, buffer.length);
      add(buffer.slice(0, n));
      buffer = buffer.slice(n);
      size -= n;
    }
  }
  if (transfer) {
    for (;;) {
      const text = await line();
      if (!/^[\da-f]+(?:;[^\r\n]*)?$/i.test(text)) {
        throw new SafeFetchError("Invalid HTTP chunk", 502);
      }
      const size = parseInt(text, 16);
      if (size > maxBytes - total) {
        throw new SafeFetchError("Website response too large", 413);
      }
      if (!size) break;
      await take(size);
      if (await line() !== "") {
        throw new SafeFetchError("Invalid HTTP chunk", 502);
      }
    }
  } else if (length !== null) await take(+length);
  else {do {
      add(buffer);
      buffer = new Uint8Array(0);
    } while (await more());}
  const bytes = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.length;
  }
  return { status, headers, html: new TextDecoder().decode(bytes) };
}

export async function safeFetchHTML(
  input: unknown,
  options: {
    io?: EgressIO;
    timeoutMs?: number;
    maxBytes?: number;
    maxRedirects?: number;
  } = {},
) {
  const io = options.io ?? denoEgress,
    maxBytes = options.maxBytes ?? 2 * 1024 * 1024;
  const controller = new AbortController();
  let conn: Wire | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      close(conn);
      reject(new SafeFetchError("Website fetch timed out", 504));
    }, options.timeoutMs ?? 10000);
  });
  async function run() {
    let url = publicURL(input);
    for (let hop = 0; hop <= (options.maxRedirects ?? 3); hop++) {
      controller.signal.throwIfAborted();
      const host = url.hostname.replace(/^\[|\]$/g, "");
      const ips = isPublicIP(host) ? [host] : await io.resolve(host);
      controller.signal.throwIfAborted();
      if (!ips.length || ips.some((ip) => !isPublicIP(ip))) {
        throw new SafeFetchError("Website resolves to a non-public address");
      }
      conn = await io.connect(ips[0], host, controller.signal);
      if (controller.signal.aborted) {
        close(conn);
        controller.signal.throwIfAborted();
      }
      let response;
      try {
        response = await exchange(conn, url, maxBytes);
      } finally {
        close(conn);
        conn = undefined;
      }
      if (![301, 302, 303, 307, 308].includes(response.status)) {
        return { html: response.html, url };
      }
      const location = response.headers.get("location");
      if (!location) throw new SafeFetchError("Invalid website redirect", 502);
      url = publicURL(new URL(location, url).href);
    }
    throw new SafeFetchError("Too many website redirects", 502);
  }
  try {
    return await Promise.race([run(), timeout]);
  } finally {
    clearTimeout(timer);
    controller.abort();
    close(conn);
  }
}
