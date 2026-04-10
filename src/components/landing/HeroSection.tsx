import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 bg-gradient-subtle opacity-60" />
      <div className="absolute top-20 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-fade-up">
            Executive accountability software for founders, operators, and leadership teams
          </div>
          <h1 className="mb-6 font-heading text-5xl font-bold tracking-tight md:text-7xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-foreground">Run a more honest</span>
            <br />
            <span className="text-gradient-primary">operating rhythm.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Intentus helps founders and executives audit how they are really operating, choose the few metrics and behaviors that matter most, and stay accountable to a focused 90-day plan with daily or weekly check-ins.
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
        </div>

        <div className="mx-auto mt-16 max-w-5xl animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <div className="overflow-hidden rounded-2xl shadow-medium animate-float">
            <img src={heroImage} alt="Intentus leadership accountability dashboard visualization" width={1920} height={1080} className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
