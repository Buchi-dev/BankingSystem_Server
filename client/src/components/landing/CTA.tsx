import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  "No monthly fees",
  "Free instant transfers",
  "24/7 customer support",
  "Advanced security features",
];

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 md:p-12 text-center glow-effect">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to Start{' '}
              <span className="gradient-text">Banking Smarter?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join over 1 million users who trust us with their finances. 
              Open your account in minutes and experience the future of banking.
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20"
                >
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="hero" size="xl" className="group">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="glass" size="xl">
                  Already have an account?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
