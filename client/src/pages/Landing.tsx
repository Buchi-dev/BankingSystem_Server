import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { Helmet } from "react-helmet-async";

const Landing = () => {
  return (
    <>
      <Helmet>
        <title>NexBank - Modern Banking Made Simple & Secure</title>
        <meta 
          name="description" 
          content="Experience the future of banking with instant transfers, advanced security, and seamless mobile access. Join 1M+ users who trust NexBank." 
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Hero />
        <Features />
        <CTA />
        <Footer />
      </div>
    </>
  );
};

export default Landing;
