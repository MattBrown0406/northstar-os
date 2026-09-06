export const MAX_JSON_BYTES = 1024 * 1024;
export const PROVIDER_TIMEOUT_MS = 90_000;

export class RequestLimitError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

/** Counts actual bytes, including chunked requests; cancels stalled/oversized streams. */
export async function readBoundedJson(req: Request, options: { maxBytes?: number; timeoutMs?: number; allowEmpty?: boolean } = {}): Promise<Record<string, any>> {
  const maxBytes = options.maxBytes ?? MAX_JSON_BYTES;
  const length = req.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    void req.body?.cancel().catch(() => {});
    throw new RequestLimitError("Request body too large or invalid Content-Length", 413);
  }
  if (!req.body) {
    if (options.allowEmpty) return {};
    throw new RequestLimitError("JSON body required");
  }
  const reader = req.body.getReader();
  const signal = AbortSignal.timeout(options.timeoutMs ?? 10_000);
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (signal.aborted) throw new RequestLimitError("Request body timed out", 408);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new RequestLimitError("Request body too large", 413);
      chunks.push(value);
    }
    if (!size && options.allowEmpty) return {};
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let parsed;
    try { parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { throw new RequestLimitError("Invalid JSON body"); }
    if (!isRecord(parsed)) throw new RequestLimitError("JSON object required");
    return parsed;
  } finally {
    signal.removeEventListener("abort", abort);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Native deadline stays attached through response-body consumption (including SSE). */
export function fetchWithDeadline(input: string | URL | Request, init: RequestInit, timeoutMs = PROVIDER_TIMEOUT_MS, fetcher: typeof fetch = fetch): Promise<Response> {
  const deadline = AbortSignal.timeout(timeoutMs);
  return fetcher(input, { ...init, signal: init.signal ? AbortSignal.any([init.signal, deadline]) : deadline });
}

export function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateAiInput(endpoint: string, body: Record<string, any>): void {
  const text = (v: unknown) => typeof v === "string";
  const invalid = () => { throw new RequestLimitError("Invalid request fields"); };
  if (endpoint === "generate-report") {
    if (!text(body.audit_id) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.audit_id)) invalid();
  }
  if (endpoint === "coaching-chat") {
    if (body.messages !== undefined && (!Array.isArray(body.messages) || !body.messages.every((m: unknown) => isRecord(m) && ["user", "assistant"].includes(m.role) && text(m.content)))) invalid();
    if ((body.mode === undefined || body.mode === "chat") && (!body.messages?.length)) invalid();
  }
  if (endpoint === "audit-coach") {
    if (!isRecord(body.responses) || !Object.values(body.responses).every(text) || !text(body.current_question) || !body.current_question) invalid();
    for (const key of ["current_section", "clarification_request", "current_question_text", "mode"]) {
      if (body[key] !== undefined && !text(body[key])) invalid();
    }
    if (body.all_questions !== undefined && (!Array.isArray(body.all_questions) || !body.all_questions.every((q: unknown) => isRecord(q) && text(q.id) && text(q.text) && text(q.section)))) invalid();
  }
}

export function limitErrorResponse(error: unknown, headers: HeadersInit): Response | null {
  const timeout = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
  if (!(error instanceof RequestLimitError) && !timeout) return null;
  return new Response(JSON.stringify({ error: timeout ? "AI request timed out" : (error as RequestLimitError).message }), {
    status: timeout ? 504 : (error as RequestLimitError).status,
    headers: { ...Object.fromEntries(new Headers(headers)), "Content-Type": "application/json" },
  });
}
