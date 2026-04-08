import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <span className="font-heading text-4xl font-extrabold tracking-tight text-foreground uppercase">Intentus</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Platform</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="/auth"><Button variant="ghost" size="sm">Log in</Button></a>
          <a href="/auth"><Button variant="hero" size="sm">Start assessment</Button></a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
