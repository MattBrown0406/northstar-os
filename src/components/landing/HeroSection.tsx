import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroDashboardMock from "@/components/landing/HeroDashboardMock";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pb-20 pt-32">
      <div className="absolute inset-0 bg-gradient-subtle opacity-60" />
      <div className="absolute right-0 top-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-up">
            Executive accountability software for founders, operators, leadership teams, and coach-led programs
          </div>
          <h1 className="mb-6 font-heading text-5xl font-bold tracking-tight md:text-7xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-foreground">Run a more honest</span>
            <br />
            <span className="text-gradient-gold">operating rhythm.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Intentus gives serious operators an honest audit of how they actually run, surfaces strengths, weaknesses, and blind spots fast, and turns that into a prioritized 90-day plan with check-ins built to catch drift before it compounds.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button asChild variant="hero" size="lg" className="px-8 py-6 text-base">
              <Link to="/auth">
                Start audit <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="lg" className="px-8 py-6 text-base">
              <Link to="/for-executives">See the executive use case</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <span>Private by design</span>
            <span>•</span>
            <span>Built around scoreboards and commitments</span>
            <span>•</span>
            <span>Coach-friendly, but operator-first</span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "0.4s" }}>
            Operating system first · Discipline over motivation · Private by design
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-6xl animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <div className="overflow-hidden rounded-[32px] border border-white/40 bg-white/40 shadow-medium backdrop-blur-sm animate-float">
            <HeroDashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
