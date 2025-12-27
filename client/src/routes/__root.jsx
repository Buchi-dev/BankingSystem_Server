
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useState, useEffect } from 'react';
import { EmployeeModal } from '../components/modals/EmployeeModal';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [showEmployeeLogin, setShowEmployeeLogin] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2 key
      if (e.key === 'F2') {
        setShowEmployeeLogin(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* 1. THE PAGE CONTENT */}
      {/* This renders whatever route matches (Login, Dashboard, etc.) */}
      <div className="min-h-screen font-sans text-slate-900 bg-gray-50">
        <Outlet />
      </div>

      {/* Employee Login Modal */}
      <EmployeeModal open={showEmployeeLogin} onCancel={() => setShowEmployeeLogin(false)} />

      {/* 2. GLOBAL DEBUGGER */}
      {/* Only shows in development mode automatically */}
      <TanStackRouterDevtools position="bottom-right" initialIsOpen={false} />
    </>
  );
}
