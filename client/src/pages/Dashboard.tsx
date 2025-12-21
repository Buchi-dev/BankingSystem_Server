import { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHome from "@/components/dashboard/DashboardHome";
import Accounts from "@/components/dashboard/Accounts";
import Transactions from "@/components/dashboard/Transactions";
import Transfer from "@/components/dashboard/Transfer";
import Cards from "@/components/dashboard/Cards";
import Settings from "@/components/dashboard/Settings";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/login");
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <Routes>
        <Route path="/" element={<DashboardHome user={user} />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transfer" element={<Transfer />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/settings" element={<Settings user={user} />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
