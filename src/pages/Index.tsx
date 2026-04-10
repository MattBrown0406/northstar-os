import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import PillarsSection from "@/components/landing/PillarsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import DifferentiatorsSection from "@/components/landing/DifferentiatorsSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";
import TrustSection from "@/components/landing/TrustSection";
import FAQPreviewSection from "@/components/landing/FAQPreviewSection";
import Seo from "@/components/seo/Seo";
import { faqJsonLd, organizationJsonLd, softwareJsonLd } from "@/lib/site";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo jsonLd={[organizationJsonLd, softwareJsonLd, faqJsonLd]} />
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <PillarsSection />
      <HowItWorksSection />
      <DifferentiatorsSection />
      <TrustSection />
      <PricingSection />
      <FAQPreviewSection />
      <Footer />
    </div>
  );
};

export default Index;
