import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { bounded } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CoachSharing, loadCoachSharing, saveCoachSharing, sharingStatus, SHARING_CATEGORIES } from "@/lib/coach-sharing";

export default function Sharing() {
  const { user } = useAuth();
  const owner = useRef(user?.id); owner.current = user?.id;
  const [state, setState] = useState<CoachSharing | null>(null);
  const [loadedOwner, setLoadedOwner] = useState<string>();
  const [draft, setDraft] = useState(false);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [notes, setNotes] = useState<{id: string; content: string; created_at: string}[]>([]);
  const [notesError, setNotesError] = useState(false);
  useEffect(() => {
    let active = true;
    setState(null); setLoadedOwner(undefined); setAck(false); setError(""); setMessage(""); setNotes([]); setNotesError(false); setBusy(false);
    if (!user) return;
    const id = user.id;
    loadCoachSharing().then(value => {
      if (!active) return;
      setState(value); setDraft(value.enabled); setLoadedOwner(id);
    }).catch(() => { if (active) setError("Unable to verify current sharing. Access status is unknown; do not assume it is private."); });
    bounded(supabase.from("coach_annotations").select("id,content,created_at").eq("client_user_id", id).eq("is_private", false).order("created_at", {ascending: false}).limit(20))
      .then(({data, error}) => { if (active) { if (error) setNotesError(true); else setNotes(data || []); } })
      .catch(() => { if (active) setNotesError(true); });
    return () => { active = false; };
  }, [user?.id, retry]);
  async function save() {
    if (!user || loadedOwner !== user.id || !ack || busy) return;
    const id = user.id;
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await saveCoachSharing(draft, ack);
      if (owner.current !== id) return;
      setState(saved); setDraft(saved.enabled); setAck(false); setMessage("Sharing preference saved and verified.");
    } catch {
      if (owner.current !== id) return;
      setState(null); setLoadedOwner(undefined);
      setError("Could not verify the change. Current access is unknown; do not assume sharing is off. Reload to check.");
    } finally { if (owner.current === id) setBusy(false); }
  }
  if (!user) return <main className="p-6"><h1>Human-coach sharing</h1><p>Sign in to view your sharing preferences.</p></main>;
  const current = loadedOwner === user.id ? state : null;
  return <main className="mx-auto max-w-2xl space-y-6 p-6 [overflow-wrap:anywhere]">
    <Link to="/dashboard" className="underline">Back to dashboard</Link>
    <h1 className="text-2xl font-bold">Human-coach sharing</h1>
    {error && <div role="alert">{error} <Button onClick={() => setRetry(n => n + 1)}>Reload sharing</Button></div>}
    {!current && !error && <p role="status">Checking current access…</p>}
    {current && <section className="space-y-4 rounded-xl border p-4">
      <p role="status">{sharingStatus(current)}</p>
      {current.legacy && <p>Your existing default is enabled. You have not yet saved an explicit preference.</p>}
      <h2 className="font-semibold">Linked human coaches</h2>
      {!current.coaches.length ? <p>No human coach is linked to your account.</p> : <ul>{current.coaches.map(c => <li key={c.id}>{c.name || "Coach"} ({c.id}) — {c.eligible && current.enabled ? "has access" : "no current content access"}{!c.eligible ? " (coach account is not eligible)" : ""}</li>)}</ul>}
      <label className="flex gap-3"><input type="checkbox" role="switch" checked={draft} disabled={busy} onChange={e => {setDraft(e.target.checked); setAck(false); setMessage("");}} />Allow all linked eligible human coaches to access the categories below</label>
      <p>Preview: {draft ? "enabling" : "disabling"} this setting applies to all categories together, including existing records and future records. It does not select individual categories or individual coaches.</p>
      <ul className="list-disc pl-5">{SHARING_CATEGORIES.map(category => <li key={category}>{category}</li>)}</ul>
      <p>Standalone weekly commitment records and commitment callbacks are not currently shared with coaches. Commitments included in check-ins or reports are shared when this switch is on.</p>
      <label className="flex gap-3"><input type="checkbox" checked={ack} disabled={busy} onChange={e => setAck(e.target.checked)} />I understand the categories and that enabling sharing also applies to eligible coaches linked in the future.</label>
      <Button disabled={!ack || busy} onClick={save}>{busy ? "Saving and verifying…" : "Save sharing preference"}</Button>
    </section>}
    {message && <p role="status">{message}</p>}
    <section className="space-y-2"><h2 className="font-semibold">What this changes</h2>
      <p>Turning sharing off blocks future human-coach content reads and edits in the app. It cannot recall information already viewed, downloaded or copied. Relationship and assigned-plan metadata remain available to your coach.</p>
      <p>This is not an AI processing control. AI coaching continues separately. Authorized administration, support and backend operations are not disabled by this preference.</p>
    </section>
    <section className="space-y-3"><h2 className="font-semibold">Shared coach feedback</h2>
      <p>These are the latest notes your human coach has marked as shared, not AI replies. Sharing does not request a session or guarantee a response. Agree on feedback timing and how to contact your coach directly.</p>
      {loadedOwner !== user.id ? <p>Feedback not loaded.</p> : notesError ? <p role="alert">Could not load shared feedback. Reload this page to retry.</p> : notes.length ? notes.map(note => <article key={note.id} className="border rounded p-3"><time>{new Date(note.created_at).toLocaleDateString()}</time><p className="whitespace-pre-wrap">{note.content}</p></article>) : <p>No shared feedback loaded.</p>}
    </section>
  </main>;
}
