import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-subtle opacity-60" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-up">
            AI operating coach for founders, executives, and coaches running accountability programs
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-foreground">See the truth.</span>
            <br />
            <span className="text-gradient-primary">Lead with intent.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Intentus gives high-performing operators an honest operating audit, surfaces the few metrics and behaviors that matter most, and turns that into a focused 90-day plan with daily or weekly accountability check-ins.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <a href="/auth">
              <Button variant="hero" size="lg" className="text-base px-8 py-6">
                Start audit <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </a>
            <a href="#how-it-works">
              <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
                See how it works
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            Private by design · Built for execution · White-label ready for coach-led client programs
          </p>
        </div>

        <div className="mt-16 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <div className="rounded-2xl overflow-hidden shadow-medium animate-float">
            <img src={heroImage} alt="Intentus leadership coaching dashboard visualization" width={1920} height={1080} className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
