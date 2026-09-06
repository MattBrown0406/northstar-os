type RecoveryBrowser = Pick<Window, "sessionStorage" | "location">;

/** Storage is optional: a privacy/quota error must not turn a loaded route into a crash. */
export async function loadRoute<T>(
  importPage: () => Promise<T>,
  key: string,
  browser: RecoveryBrowser | undefined = typeof window === "undefined" ? undefined : window,
): Promise<T> {
  const storageKey = `route-retry:${key}`;
  let page: T;
  try {
    page = await importPage();
  } catch (error) {
    let canReload = false;
    try {
      if (browser && browser.sessionStorage.getItem(storageKey) !== "true") {
        browser.sessionStorage.setItem(storageKey, "true");
        canReload = true;
      }
    } catch {
      // Without a durable retry marker, reloading could loop forever.
    }
    if (canReload && browser) {
      browser.location.reload();
      return new Promise<never>(() => undefined);
    }
    throw error;
  }
  try {
    browser?.sessionStorage.removeItem(storageKey);
  } catch {
    // The route loaded successfully; retry bookkeeping is best-effort.
  }
  return page;
}
