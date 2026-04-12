import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { brandLogo as logo } from "@/lib/brand";

const Navbar = () => {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-none" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)' }}>
      <div className="container mx-auto flex h-20 items-end justify-between px-4 pb-2">
        <Link to="/" className="flex items-end">
          <img src={logo} alt="Intentus" className="h-16 w-auto object-contain" />
        </Link>

        <div className="hidden items-end gap-6 md:flex pb-0.5">
          <a href="/#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <Link to="/for-executives" className="text-sm text-muted-foreground transition-colors hover:text-foreground">For executives</Link>
          <Link to="/for-coaches" className="text-sm text-muted-foreground transition-colors hover:text-foreground">For coaches</Link>
          <Link to="/operating-audit" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Operating audit</Link>
          <a href="/#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          <Link to="/faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">FAQ</Link>
        </div>

        <div className="flex items-end gap-3 pb-0.5">
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
