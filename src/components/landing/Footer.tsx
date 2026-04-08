import { Compass } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <span className="font-heading text-xl font-extrabold tracking-tight text-foreground uppercase">Intentus</span>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-xl leading-relaxed">
            Intentus provides coaching and self-reflection tools for operating discipline and execution accountability. It is not medical advice or mental health treatment. If you are in crisis, contact local emergency services.
          </p>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Intentus</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
