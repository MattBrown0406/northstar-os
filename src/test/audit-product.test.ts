import { describe, it, expect, vi, beforeEach } from 'vitest';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// Execute the actual production callbacks without mounting unrelated paid/API UI.
// PRODUCT_BASELINE=1 runs identical regressions against HEAD without modifying files.
function callback(file: string, name: string, scope: Record<string, unknown> = {}) {
  const source = process.env.PRODUCT_BASELINE
    ? execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' })
    : readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression = '';
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name && node.initializer) expression = node.initializer.getText(ast);
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) expression = node.getText(ast).replace(/^export /, '');
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!expression) throw new Error(`Missing ${name}`);
  const js = ts.transpileModule(`const extracted = ${expression};`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  return new Function(...Object.keys(scope), `${js}; return extracted;`)(...Object.values(scope));
}
function db(error: unknown = null) {
  const query: Record<string, unknown> = {};
  for (const method of ['update', 'insert', 'delete', 'eq', 'select', 'single', 'order', 'limit']) query[method] = vi.fn(() => query);
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ error }).then(resolve);
  return { from: vi.fn(() => query), query };
}
beforeEach(() => localStorage.clear());

describe('product persisted-state regressions', () => {
  it('fails re-audit eligibility closed when cooldown lookup fails', async () => {
    const profile = db();
    profile.query.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: { plan_tier: 'premium' }, error: null }).then(resolve);
    const history = db({ message: 'offline' });
    const supabase = { from: vi.fn().mockReturnValueOnce(profile.query).mockReturnValueOnce(history.query) };
    const result = await callback('src/lib/reaudit.ts', 'canReaudit', { supabase })('u');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Unable');
  });
  it('uses a local Monday date, not its UTC day', () => {
    const getMonday = callback('src/lib/commitments.ts', 'getMondayOfWeek');
    const date = new Date(2026, 8, 7, 0, 30);
    expect(getMonday(date)).toBe('2026-09-07');
  });
  it('clears stale completion timestamp and reflection on corrected outcome', async () => {
    const supabase = db();
    await callback('src/lib/commitments.ts', 'recordCommitmentOutcome', { supabase })('id', 'no', '');
    expect(supabase.query.update).toHaveBeenCalledWith({ outcome: 'no', completed_at: null, reflection: null });
  });
  it('isolates draft identity and rejects malformed stored lists', () => {
    const load = callback('src/pages/CheckIn.tsx', 'loadDraft', { DRAFT_KEY: 'intentus_checkin_draft', DRAFT_TTL_MS: 86400000, localStorage });
    const draft = { savedAt: Date.now(), step: 1, mood: 5, energy: 5, wins: ['private'], blockers: [], commitments: [], oneThing: '', callbackReflection: '', callbackOutcome: null, extras: {} };
    localStorage.setItem('intentus_checkin_draft:alice', JSON.stringify(draft));
    expect(load('alice')).toEqual(draft);
    expect(load('bob')).toBeNull();
    localStorage.setItem('intentus_checkin_draft:alice', JSON.stringify({ ...draft, wins: 'invalid' }));
    expect(load('alice')).toBeNull();
  });
  it.each([false, true])('does not change plan completion after a denied write (completed=%s)', async completed => {
    const supabase = db({ message: 'denied' });
    const setCompletions = vi.fn();
    const toast = vi.fn();
    await callback('src/pages/Report.tsx', 'toggleActionComplete', { actionFlight: { current: false }, supabase, user: { id: 'u' }, report: { id: 'r' }, completions: { '0-0': completed }, setCompletions, toast })(0, 0);
    expect(supabase.query[completed ? 'delete' : 'insert']).toHaveBeenCalledOnce();
    expect(setCompletions).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });
  it('retains report action editor on denied save', async () => {
    const setEditedPlan = vi.fn(), setEditingAction = vi.fn(), setEditActionText = vi.fn();
    const supabase = db({ message: 'denied' });
    await callback('src/pages/Report.tsx', 'saveActionEdit', { actionFlight: { current: false }, supabase, report: { id: 'r' }, user: { id: 'u' }, editActionText: 'new', editedPlan: [{ actions: ['old'] }], setEditedPlan, setEditingAction, setEditActionText, toast: vi.fn() })(0, 0);
    expect(supabase.query.update).toHaveBeenCalledOnce();
    expect(setEditedPlan).not.toHaveBeenCalled();
    expect(setEditingAction).not.toHaveBeenCalled();
    expect(setEditActionText).not.toHaveBeenCalled();
  });
  it('does not complete or advance audit after a failed final answer save', async () => {
    const setCompleted = vi.fn(), setResponses = vi.fn(), setMessages = vi.fn(), setInput = vi.fn();
    const supabase = db({ message: 'denied' });
    await callback('src/pages/Audit.tsx', 'processAnswer', { answerFlight: { current: false }, initializing: false, initError: null, setAnswerSaving: vi.fn(), user: { id: 'u' }, supabase, auditId: 'a', currentQ: 0, responses: {}, AUDIT_QUESTIONS: [{ id: 'q' }], AUDIT_SECTIONS: [{}], setCompleted, setResponses, setMessages, setInput, setCoachStreaming: vi.fn(), profile: {}, streamCoachResponse: vi.fn(), toast: vi.fn() })('retain this answer');
    expect(supabase.query.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed', responses: { q: 'retain this answer' } }));
    expect(setCompleted).not.toHaveBeenCalled();
    expect(setResponses).not.toHaveBeenCalled();
    expect(setInput).toHaveBeenCalledWith('retain this answer');
  });
});
