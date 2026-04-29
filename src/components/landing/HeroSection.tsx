import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroDashboardMock from "@/components/landing/HeroDashboardMock";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pb-12 pt-[calc(env(safe-area-inset-top,0px)+124px)] sm:pb-20 sm:pt-32 md:pt-32">
      <div className="absolute inset-0 bg-gradient-subtle opacity-60" />
      <div className="absolute right-0 top-20 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 hidden items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-up sm:inline-flex">
            Accountability software for founders, leaders, operators, and anyone with serious growth goals
          </div>
          <h1 className="mb-6 font-heading text-3xl font-bold tracking-tight sm:text-5xl md:text-7xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-foreground">Run a more honest</span>
            <br />
            <span className="text-gradient-gold">operating rhythm.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-base leading-relaxed text-muted-foreground sm:mb-10 sm:text-lg md:text-xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Intentus helps serious operators run an honest audit, build a focused 90-day plan, and stay accountable with disciplined check-ins.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button asChild variant="hero" size="lg" className="px-8 py-6 text-base">
              <Link to="/auth">
                Start audit <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="lg" className="hidden px-8 py-6 text-base sm:inline-flex">
              <Link to="/for-leaders">See how leaders use it</Link>
            </Button>
          </div>
          <div className="mt-6 hidden flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground animate-fade-up sm:flex" style={{ animationDelay: "0.4s" }}>
            <span>Private by design</span>
            <span>•</span>
            <span>Built around scoreboards and commitments</span>
            <span>•</span>
            <span>Coach-friendly, but operator-first</span>
          </div>
          <p className="mt-4 hidden text-xs text-muted-foreground animate-fade-up sm:block" style={{ animationDelay: "0.4s" }}>
            Operating system first · Discipline over motivation · Private by design
          </p>
        </div>

        <div className="mx-auto mt-12 hidden max-w-6xl animate-fade-up md:block" style={{ animationDelay: "0.5s" }}>
          <div className="overflow-hidden rounded-[32px] border border-white/40 bg-white/40 shadow-medium backdrop-blur-sm animate-float">
            <HeroDashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
