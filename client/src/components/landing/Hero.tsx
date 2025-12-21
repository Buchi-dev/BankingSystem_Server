import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Smartphone, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen hero-gradient overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container relative z-10 mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Trusted by 1M+ users worldwide</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Banking Made{' '}
            <span className="gradient-text">Simple</span>
            <br />
            <span className="text-muted-foreground">& Secure</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Experience the future of banking with instant transfers, advanced security, 
            and seamless mobile access. Your money, your way.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/register">
              <Button variant="hero" size="xl" className="group">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="hero-outline" size="xl">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">$2B+</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-accent-text mb-1">1M+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>

        {/* Floating Feature Cards */}
        <div className="hidden lg:block">
          <div className="absolute top-1/4 left-8 glass-card p-4 animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold">Instant Transfers</div>
                <div className="text-xs text-muted-foreground">Send money in seconds</div>
              </div>
            </div>
          </div>

          <div className="absolute top-1/3 right-8 glass-card p-4 animate-float" style={{ animationDelay: '1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-accent-bg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold">Mobile Banking</div>
                <div className="text-xs text-muted-foreground">Bank on the go</div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-1/3 left-16 glass-card p-4 animate-float" style={{ animationDelay: '1.5s' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center">
                <Shield className="w-5 h-5 text-success-foreground" />
              </div>
              <div>
                <div className="text-sm font-semibold">Bank-Grade Security</div>
                <div className="text-xs text-muted-foreground">256-bit encryption</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
