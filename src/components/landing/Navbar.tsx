import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { brandLogo as logo } from "@/lib/brand";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navLinks = [
  { label: "How it works", href: "/#how-it-works", isAnchor: true },
  { label: "For executives", href: "/for-executives", isAnchor: false },
  { label: "For coaches", href: "/for-coaches", isAnchor: false },
  { label: "Operating audit", href: "/operating-audit", isAnchor: false },
  { label: "Pricing", href: "/#pricing", isAnchor: true },
  { label: "FAQ", href: "/faq", isAnchor: false },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-none" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)' }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20 md:items-end md:pb-2">
        <Link to="/" className="flex items-center md:items-end">
          <img src={logo} alt="Intentus" className="h-10 w-auto object-contain md:h-16" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-end gap-6 md:flex pb-0.5">
          {navLinks.map((link) =>
            link.isAnchor ? (
              <a key={link.href} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} to={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-end gap-3 pb-0.5 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/auth">Start audit</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Button asChild variant="hero" size="sm" className="text-xs px-3">
            <Link to="/auth">Start audit</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <img src={logo} alt="Intentus" className="h-8 w-auto object-contain" />
                </div>

                {/* Links */}
                <nav className="flex flex-col gap-1 px-4 py-4">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      {link.isAnchor ? (
                        <a
                          href={link.href}
                          className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          {link.label}
                        </Link>
                      )}
                    </SheetClose>
                  ))}
                </nav>

                {/* CTA buttons */}
                <div className="mt-auto border-t border-border px-4 py-4 space-y-2">
                  <SheetClose asChild>
                    <Button asChild variant="ghost" className="w-full justify-center">
                      <Link to="/auth">Log in</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="hero" className="w-full justify-center">
                      <Link to="/auth">Start audit</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
