import { Compass } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary rounded-lg p-1.5">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Northstar OS</span>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-xl leading-relaxed">
            This product provides coaching and self-reflection tools. It is not medical advice or mental health treatment. If you are in crisis, contact local emergency services.
          </p>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Northstar OS</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
