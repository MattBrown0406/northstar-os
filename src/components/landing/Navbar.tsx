import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/intentus-logo.png";

const Navbar = () => {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)' }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Intentus" className="h-14 w-auto" />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <a href="/#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <Link to="/for-executives" className="text-sm text-muted-foreground transition-colors hover:text-foreground">For executives</Link>
          <Link to="/for-coaches" className="text-sm text-muted-foreground transition-colors hover:text-foreground">For coaches</Link>
          <Link to="/operating-audit" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Operating audit</Link>
          <a href="/#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          <Link to="/faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">FAQ</Link>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/auth">Start audit</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
