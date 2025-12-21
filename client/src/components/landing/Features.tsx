import { Shield, Smartphone, Zap, CreditCard, Globe, Lock } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your data is protected with 256-bit encryption and advanced fraud detection systems.",
    gradient: "gradient-bg",
  },
  {
    icon: Smartphone,
    title: "Mobile Banking",
    description: "Access your accounts, make payments, and manage cards from anywhere in the world.",
    gradient: "gradient-accent-bg",
  },
  {
    icon: Zap,
    title: "Instant Transfers",
    description: "Send and receive money instantly to any bank account or mobile wallet.",
    gradient: "gradient-bg",
  },
  {
    icon: CreditCard,
    title: "Virtual Cards",
    description: "Create virtual cards for online shopping with enhanced security and spending limits.",
    gradient: "gradient-accent-bg",
  },
  {
    icon: Globe,
    title: "Global Payments",
    description: "Make international transfers at the best exchange rates with zero hidden fees.",
    gradient: "gradient-bg",
  },
  {
    icon: Lock,
    title: "Biometric Login",
    description: "Secure your account with fingerprint or face recognition for quick, safe access.",
    gradient: "gradient-accent-bg",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Manage Your Money</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to give you complete control over your finances.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card-hover p-6 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
