import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-60" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-up">
            AI Executive Coach + Personal Operating System
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="text-foreground">Stop drifting.</span>
            <br />
            <span className="text-gradient-primary">Start operating.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Get brutally clear on what's actually driving your results (and your drift). Turn it into a 90-day plan—and stay aligned with recurring check-ins.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="lg" className="text-base px-8 py-6">
              Start Free <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
              See how it works
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            In-app only · Private by design · Cancel anytime
          </p>
        </div>

        <div className="mt-16 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <div className="rounded-2xl overflow-hidden shadow-medium animate-float">
            <img src={heroImage} alt="Northstar OS dashboard visualization" width={1920} height={1080} className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
