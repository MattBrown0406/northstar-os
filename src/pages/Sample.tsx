import { Link } from "react-router-dom";
import InteractiveSample from "@/components/InteractiveSample";
import Seo from "@/components/seo/Seo";

export default function Sample() {
  return <main className="min-h-screen bg-background px-4 py-8">
    <div className="mx-auto max-w-3xl space-y-6">
      <Seo title="Try an Intentus sample" description="Try three short questions and see an illustrative report. No signup required." path="/sample" />
      <Link className="text-primary underline" to="/">Back to Intentus</Link>
      <h1 className="font-heading text-3xl font-bold">Try Intentus before signing up</h1>
      <InteractiveSample />
    </div>
  </main>;
}
