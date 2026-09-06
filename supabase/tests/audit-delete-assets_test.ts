import {
  AccountDeletionError,
  ASSET_MAX_CALLS,
  ASSET_PAGE_SIZE,
  type AssetBucket,
  deleteAccountWithAssets,
} from "../functions/_shared/delete-assets.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
function assert(value: unknown, message = "assertion failed"): asserts value {
  if (!value) throw new Error(message);
}
async function fails(run: () => Promise<void>, phase = "storage") {
  try {
    await run();
  } catch (error) {
    assert(error instanceof AccountDeletionError && error.phase === phase);
    return;
  }
  throw new Error("Expected failure");
}
function fixture(names: string[]) {
  const objects = new Set(names);
  const lists: string[] = [];
  const removes: string[][] = [];
  const bucket: AssetBucket = {
    list(prefix, options) {
      lists.push(prefix);
      assert(prefix.startsWith(`${USER}/`));
      assert(options.offset === 0 && options.limit === ASSET_PAGE_SIZE);
      const entries = new Map<string, { name: string; id: string | null }>();
      for (const path of [...objects].sort()) {
        if (!path.startsWith(prefix)) continue;
        const rest = path.slice(prefix.length);
        const name = rest.split("/")[0];
        entries.set(name, { name, id: rest.includes("/") ? null : path });
      }
      return Promise.resolve({
        data: [...entries.values()].slice(0, options.limit),
        error: null,
      });
    },
    remove(paths) {
      removes.push(paths);
      paths.forEach((path) => {
        assert(path.startsWith(`${USER}/`));
        objects.delete(path);
      });
      return Promise.resolve({ error: null });
    },
  };
  return { bucket, objects, lists, removes };
}

Deno.test("drains repeated first pages, old extensions and folders; preserves other users", async () => {
  const f = fixture([
    ...Array.from({ length: 251 }, (_, i) => `${USER}/logo-${i}.png`),
    `${USER}/logo.jpg`,
    `${USER}/headshot.webp`,
    `${USER}/nested/old.png`,
    `${OTHER}/logo.png`,
    `${USER}suffix/foreign.png`,
  ]);
  let authCalls = 0;
  await deleteAccountWithAssets(f.bucket, USER, (id, soft) => {
    assert(id === USER && soft === false);
    assert(f.objects.size === 2);
    assert(f.lists.at(-1) === `${USER}/`);
    authCalls++;
    return Promise.resolve({ error: null });
  });
  assert(authCalls === 1 && f.removes.length >= 4);
  assert(f.removes.flat().length === 254);
  assert(
    f.objects.has(`${OTHER}/logo.png`) &&
      f.objects.has(`${USER}suffix/foreign.png`),
  );
});

for (const operation of ["list", "remove"] as const) {
  for (const thrown of [false, true]) {
    Deno.test(`${operation} ${thrown ? "throws" : "returns error"}: Auth never called`, async () => {
      const f = fixture([`${USER}/logo.png`]);
      f.bucket[operation] = () => {
        if (thrown) throw new Error("network");
        return Promise.resolve({
          data: null,
          error: { message: "service failure" },
        });
      };
      let auth = false;
      await fails(() =>
        deleteAccountWithAssets(f.bucket, USER, () => {
          auth = true;
          return Promise.resolve({ error: null });
        })
      );
      assert(!auth);
    });
  }
}

Deno.test("partial removal failure resumes idempotently on retry", async () => {
  const f = fixture(Array.from({ length: 150 }, (_, i) => `${USER}/${i}.png`));
  const remove = f.bucket.remove;
  let calls = 0;
  f.bucket.remove = (paths) => {
    if (++calls === 2) {
      f.objects.delete(paths[0]); // A provider may fail after partial work.
      return Promise.resolve({ error: new Error("partial") });
    }
    return remove(paths);
  };
  let auth = 0;
  const finish = () => {
    auth++;
    return Promise.resolve({ error: null });
  };
  await fails(() => deleteAccountWithAssets(f.bucket, USER, finish));
  assert(auth === 0 && f.objects.size === 49);
  await deleteAccountWithAssets(f.bucket, USER, finish);
  assert(Number(auth) === 1 && Number(f.objects.size) === 0);
});

Deno.test("Auth returned/thrown errors retain phase; retry after storage success", async () => {
  for (const thrown of [false, true]) {
    const f = fixture([`${USER}/logo.png`]);
    await fails(() =>
      deleteAccountWithAssets(f.bucket, USER, () => {
        if (thrown) throw new Error("Auth unavailable");
        return Promise.resolve({ error: new Error("Auth blocked") });
      }), "auth");
    assert(f.objects.size === 0);
    await deleteAccountWithAssets(
      f.bucket,
      USER,
      () => Promise.resolve({ error: null }),
    );
    assert(f.removes.length === 1);
  }
});

Deno.test("unsafe names reject whole batch before any deletion or Auth", async () => {
  for (
    const name of [
      "..",
      ".",
      "../foreign",
      `${OTHER}/logo.png`,
      "/absolute",
      "a\\b",
      "%2e%2e",
      "",
      "a\u0000b",
    ]
  ) {
    const f = fixture([]);
    f.bucket.list = () =>
      Promise.resolve({
        data: [{ name: "safe.png", id: "1" }, { name, id: "2" }],
        error: null,
      });
    await fails(() =>
      deleteAccountWithAssets(f.bucket, USER, () => {
        throw new Error("Auth must not run");
      })
    );
    assert(f.removes.length === 0);
  }
});

Deno.test("invalid principal and null listing fail closed", async () => {
  const f = fixture([]);
  for (const id of ["", `${USER}/..`, "../other", "not-a-uuid"]) {
    await fails(() =>
      deleteAccountWithAssets(
        f.bucket,
        id,
        () => Promise.resolve({ error: null }),
      )
    );
  }
  assert(f.lists.length === 0);
  f.bucket.list = () => Promise.resolve({ data: null, error: null });
  await fails(() =>
    deleteAccountWithAssets(f.bucket, USER, () => {
      throw new Error("Auth must not run");
    })
  );
});

Deno.test("failed empty verification blocks Auth", async () => {
  const f = fixture([`${USER}/logo.png`]);
  const list = f.bucket.list;
  f.bucket.list = (prefix, options) =>
    f.objects.size
      ? list(prefix, options)
      : Promise.resolve({ data: null, error: new Error("verify failed") });
  let auth = false;
  await fails(() =>
    deleteAccountWithAssets(f.bucket, USER, () => {
      auth = true;
      return Promise.resolve({ error: null });
    })
  );
  assert(!auth && f.objects.size === 0);
});

Deno.test("stale/no-op batches exhaust finite budget without Auth", async () => {
  const f = fixture([`${USER}/logo.png`]);
  let removes = 0;
  f.bucket.remove = () => {
    removes++;
    return Promise.resolve({ error: null });
  };
  let auth = false;
  await fails(() =>
    deleteAccountWithAssets(f.bucket, USER, () => {
      auth = true;
      return Promise.resolve({ error: null });
    })
  );
  assert(!auth && f.lists.length + removes === ASSET_MAX_CALLS);
});
