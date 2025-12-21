import { Button } from "@/components/ui/button";
import { Menu, X, Landmark } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Landmark className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">NexBank</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">
              Security
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="default">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Features
              </a>
              <a
                href="#security"
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Security
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-center">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button variant="default" className="w-full justify-center">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
