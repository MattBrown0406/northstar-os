import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import PillarsSection from "@/components/landing/PillarsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DifferentiatorsSection from "@/components/landing/DifferentiatorsSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <PillarsSection />
      <HowItWorksSection />
      <DifferentiatorsSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
