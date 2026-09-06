import { readBoundedJson, RequestLimitError, fetchWithDeadline, validateAiInput, limitErrorResponse } from "../functions/_shared/request-limits.ts";
function assert(v: unknown): asserts v { if (!v) throw new Error("assertion failed"); }
async function rejects(fn: () => unknown, status: number) {
  try { await fn(); } catch (e) { assert(e instanceof RequestLimitError && e.status === status); return; }
  throw new Error("expected rejection");
}
function request(chunks: string[], headers = {}) {
  return new Request("https://local.test", { method: "POST", headers, body: new ReadableStream({ start(c) { for (const s of chunks) c.enqueue(new TextEncoder().encode(s)); c.close(); } }) });
}
Deno.test("bounded actual stream: no content length, lying length, UTF-8 bytes and exact limit", async () => {
  assert((await readBoundedJson(request(['{"a":', '1}']), { maxBytes: 7 })).a === 1);
  await rejects(() => readBoundedJson(request(['{"a":"', 'x'.repeat(40), '"}']), { maxBytes: 20 }), 413);
  await rejects(() => readBoundedJson(request(['x'.repeat(30)], { 'content-length': '1' }), { maxBytes: 20 }), 413);
  await rejects(() => readBoundedJson(request(['{"a":"é"}']), { maxBytes: 9 }), 413);
  await rejects(() => readBoundedJson(request(['{}'], { 'content-length': '9999999' })), 413);
});
Deno.test("malformed/nonobject JSON rejected; optional empty body preserved", async () => {
  for (const s of ['{', 'null', '[]', '1', '']) await rejects(() => readBoundedJson(request([s])), 400);
  assert(Object.keys(await readBoundedJson(request([]), { allowEmpty: true })).length === 0);
});
Deno.test("stalled incoming stream times out and cancels without timer leaks", async () => {
  let cancelled = false;
  const req = new Request('https://local.test', { method: 'POST', body: new ReadableStream({ cancel() { cancelled = true; } }) });
  await rejects(() => readBoundedJson(req, { timeoutMs: 5 }), 408);
  assert(cancelled);
});
Deno.test("provider fake fetch actually aborts and maps to 504", async () => {
  let aborted = false;
  const fake: typeof fetch = (_url, init) => new Promise((_resolve, reject) => {
    init!.signal!.addEventListener('abort', () => { aborted = true; reject(init!.signal!.reason); }, { once: true });
  });
  try { await fetchWithDeadline('https://fake.test', {}, 5, fake); throw new Error('expected abort'); }
  catch (e) { assert(aborted); assert(limitErrorResponse(e, {})?.status === 504); }
});
Deno.test("provider deadline covers body after headers and success has no dangling JS timer", async () => {
  const fake: typeof fetch = (_url, init) => Promise.resolve(new Response(new ReadableStream({ start(c) {
    init!.signal!.addEventListener('abort', () => c.error(init!.signal!.reason), { once: true });
  } })));
  const response = await fetchWithDeadline('https://fake.test', {}, 5, fake);
  try { await response.text(); throw new Error('expected abort'); } catch (e) { assert(e instanceof DOMException && e.name === 'TimeoutError'); }
  const fast: typeof fetch = () => Promise.resolve(new Response('{}'));
  assert(await (await fetchWithDeadline('https://fake.test', {}, 90000, fast)).text() === '{}');
});
Deno.test("key fields validated without disabling empty debrief", async () => {
  validateAiInput('coaching-chat', { mode: 'check-in-debrief' });
  validateAiInput('audit-coach', { responses: {}, current_question: 'q1' });
  await rejects(() => validateAiInput('coaching-chat', { messages: [null] }), 400);
  await rejects(() => validateAiInput('generate-report', { audit_id: {} }), 400);
  await rejects(() => validateAiInput('audit-coach', { responses: [], current_question: 'q1' }), 400);
});
