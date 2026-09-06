// Execute the actual Settings deletion handler with deferred cleanup.
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { expect, it, vi } from 'vitest';
const source = readFileSync('src/pages/Settings.tsx', 'utf8');
const ast = ts.createSourceFile('Settings.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler = '';
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'handleDeleteAccount') handler = node.initializer!.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
function fixture(cleanup: () => Promise<void>, response = { data: null as null | { error: string }, error: null }) {
  const owner = { current: 'a' as string | undefined };
  const invoke = vi.fn().mockResolvedValue(response);
  const signOut = vi.fn().mockResolvedValue(undefined);
  const toast = vi.fn();
  const dependencies = { user: { id: 'a' }, hydrated: 'a', confirmDelete: true, deleting: false, saving: false, owner, setDeleting: vi.fn(), cleanupBeforeSignOut: cleanup, bounded: (p: Promise<unknown>) => p, supabase: { functions: { invoke } }, signOut, toast, navigate: vi.fn() };
  const js = ts.transpileModule(`const handler = ${handler};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const run = new Function(...Object.keys(dependencies), `${js}; return handler;`)(...Object.values(dependencies));
  return { run, owner, invoke, signOut, toast };
}
it('does not delete the next account after deferred push cleanup and owner invalidation', async () => {
  let release!: () => void;
  const f = fixture(() => new Promise<void>(resolve => { release = resolve; }));
  const pending = f.run();
  f.owner.current = undefined;
  release();
  await pending;
  expect(f.invoke).not.toHaveBeenCalled();
  expect(f.signOut).not.toHaveBeenCalled();
  expect(source).toContain('return () => { owner.current = undefined; };');
});
it('does not claim deletion or sign out for returned application errors', async () => {
  const f = fixture(async () => {}, { data: { error: 'deletion rejected' }, error: null });
  await f.run();
  expect(f.signOut).not.toHaveBeenCalled();
  expect(f.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Account deletion failed', description: 'deletion rejected' }));
});
