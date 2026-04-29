import { Link } from "react-router-dom";
import { brandLogo as logo } from "@/lib/brand";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Intentus" className="h-7 w-auto" />
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Accountability software for founders, leaders, operators, and anyone serious about growth — including coach-led client programs. Built to turn an honest audit into a focused 90-day operating rhythm.
            </p>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
              Intentus provides coaching and self-reflection tools for operating discipline and execution accountability. It is not medical advice or mental health treatment.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-base font-bold text-foreground">Explore</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link to="/for-leaders" className="hover:text-foreground">For leaders</Link></li>
              <li><Link to="/accountability-software" className="hover:text-foreground">Accountability software</Link></li>
              <li><Link to="/operating-audit" className="hover:text-foreground">Operating audit</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link to="/support" className="hover:text-foreground">Support</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-base font-bold text-foreground">Use cases</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link to="/for-coaches" className="hover:text-foreground">Coaches and advisors</Link></li>
              <li><a href="/#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><Link to="/auth" className="hover:text-foreground">Start audit</Link></li>
              <li><Link to="/auth" className="hover:text-foreground">Log in</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gold pt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Intentus
        </div>
      </div>
    </footer>
  );
};

export default Footer;
