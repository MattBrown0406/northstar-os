import { describe, it, expect, vi } from 'vitest';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { format } from 'date-fns';
function callback(file: string, name: string, scope: Record<string, unknown> = {}) {
  const source = readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression = '';
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name && node.initializer) expression = node.initializer.getText(ast);
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) expression = node.getText(ast).replace(/^export /, '');
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const js = ts.transpileModule(`const extracted = ${expression};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(...Object.keys(scope), `${js}; return extracted;`)(...Object.values(scope));
}
function db(result: unknown) {
  const q: any = {};
  for (const m of ['insert', 'update', 'delete', 'eq', 'select', 'single']) q[m] = vi.fn(() => q);
  q.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return { from: vi.fn(() => q), q };
}
describe('actual follow-up production callbacks', () => {
  const file = 'src/lib/commitments.ts';
  const getMondayOfWeek = callback(file, 'getMondayOfWeek');
  const streak = callback(file, 'computeFollowThroughStreak', { getMondayOfWeek });
  const now = new Date(2026, 8, 7, 12);
  const row = (week_start: string, outcome: string | null) => ({ week_start, outcome });
  it('counts actual weeks and tolerates only current pending week', () => {
    expect(streak([row('2026-08-24','yes'),row('2026-08-31','partially'),row('2026-09-07',null)],now)).toBe(2);
    expect(streak([row('2026-08-24','yes'),row('2026-08-31',null)],now)).toBe(0);
    expect(streak([row('2026-08-17','yes'),row('2026-08-31','yes')],now)).toBe(1);
    expect(streak([row('2026-08-24','yes')],now)).toBe(0);
  });
  it('discards late same-account history loads', async () => {
    const supabase = db({data:[{id:'old',role:'user',content:'old'}],error:null});
    for (const method of ['gte','order']) supabase.q[method] = vi.fn(() => supabase.q);
    const setMessages = vi.fn();
    await callback('src/pages/Coaching.tsx','loadHistory',{supabase,user:{id:'u'},generation:1,historyGeneration:{current:2},setHistoryLoading:vi.fn(),setHistoryError:vi.fn(),setMessages,localSessionDate:()=> '2026-09-01'})();
    expect(setMessages).not.toHaveBeenCalled();
  });
  it('retains editor on unacknowledged report update', async () => {
    const setEditedPlan = vi.fn(), setEditingAction = vi.fn();
    await callback('src/pages/Report.tsx','saveActionEdit',{supabase:db({data:null,error:null}),user:{id:'u'},report:{id:'r'},actionFlight:{current:false},editActionText:'new',editedPlan:[{actions:['old']}],setEditedPlan,setEditingAction,setEditActionText:vi.fn(),toast:vi.fn()})(0,0);
    expect(setEditedPlan).not.toHaveBeenCalled();
    expect(setEditingAction).not.toHaveBeenCalled();
  });
  it('uses local date-only sessions at midnight', () => {
    expect(callback('src/pages/Coaching.tsx','localSessionDate',{format})(new Date(2026,8,7,0,1))).toBe('2026-09-07');
  });
  it('serializes report double clicks and rejects zero-row acknowledgement', async () => {
    let resolve!: (x: unknown) => void;
    const supabase = db(new Promise(r => { resolve = r; }));
    const setCompletions = vi.fn(), toast = vi.fn(), actionFlight = { current: false };
    const toggle = callback('src/pages/Report.tsx','toggleActionComplete',{supabase, user:{id:'u'},report:{id:'r'},completions:{},setCompletions,toast,actionFlight});
    const pending = toggle(0,0);
    await toggle(0,0);
    expect(supabase.q.insert).toHaveBeenCalledTimes(1);
    resolve({data:null,error:null});
    await pending;
    expect(setCompletions).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalled();
    expect(actionFlight.current).toBe(false);
  });
  it('retains audit answer on zero-row save and releases flight', async () => {
    const setInput = vi.fn(), setResponses = vi.fn(), answerFlight = {current:false};
    await callback('src/pages/Audit.tsx','processAnswer',{supabase:db({data:null,error:null}),user:{id:'u'},auditId:'a',answerFlight,initializing:false,initError:null,setAnswerSaving:vi.fn(), currentQ:0,responses:{},AUDIT_QUESTIONS:[{id:'q'}],AUDIT_SECTIONS:[{}],setInput,setResponses,toast:vi.fn()})('keep answer');
    expect(setInput).toHaveBeenCalledWith('keep answer');
    expect(setResponses).not.toHaveBeenCalled();
    expect(answerFlight.current).toBe(false);
  });
  it('renders section transition before next question without a late timer', async () => {
    vi.useFakeTimers();
    try {
      let messages: any[] = [];
      const setCurrentQ = vi.fn();
      const questions = [
        {id:'q1', sectionIndex:0, section:'First', text:'First question'},
        {id:'q2', sectionIndex:1, section:'Second', text:'Next question'},
      ];
      await callback('src/pages/Audit.tsx','processAnswer', {
        supabase:db({data:{id:'a'},error:null}), user:{id:'u'}, auditId:'a',
        answerFlight:{current:false}, initializing:false, initError:null,
        setAnswerSaving:vi.fn(), currentQ:0, responses:{}, AUDIT_QUESTIONS:questions,
        setInput:vi.fn(), setResponses:vi.fn(), toast:vi.fn(), profile:{},
        setMessages:(fn:any)=>{messages=fn(messages);}, setCoachStreaming:vi.fn(), setCurrentQ,
        streamCoachResponse:async ({onDone}:any)=>onDone(),
      })('answer');
      expect(messages.slice(-2).map(m=>m.text)).toEqual(['Moving on to **Second**.', 'Next question']);
      expect(setCurrentQ).toHaveBeenCalledWith(1);
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
  it('retries history with stable ID, acknowledges duplicate, never generates AI', async () => {
    let messages:any[] = [{id:'m',role:'user',content:'hi',session_date:'2026-09-07'}];
    const supabase = db({data:null,error:{code:'offline'}});
    const saveFlights = {current:new Set()};
    const persist = callback('src/pages/Coaching.tsx','persistMessage',{user:{id:'u'},supabase,saveFlights,setMessages:(fn:any)=>{messages=fn(messages);}});
    await persist(messages[0]);
    expect(messages[0].saveState).toBe('unsaved');
    supabase.q.then = (resolve:any) => Promise.resolve({data:{id:'m',role:'user',content:'hi',session_date:'2026-09-07'},error:null}).then(resolve);
    await persist(messages[0]);
    expect(messages[0].saveState).toBe('saved');
    expect(supabase.q.insert.mock.calls.map((c:any)=>c[0].id)).toEqual(['m','m']);
  });
});
