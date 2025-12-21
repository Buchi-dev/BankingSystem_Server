import { Landmark } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 bg-card/30 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Landmark className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">NexBank</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © 2024 NexBank. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
