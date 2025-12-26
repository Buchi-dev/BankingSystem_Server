import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      {/* 1. THE PAGE CONTENT */}
      {/* This renders whatever route matches (Login, Dashboard, etc.) */}
      <div className="min-h-screen font-sans text-slate-900 bg-gray-50">
        <Outlet />
      </div>

      {/* 2. GLOBAL DEBUGGER */}
      {/* Only shows in development mode automatically */}
      <TanStackRouterDevtools position="bottom-right" initialIsOpen={false} />
    </>
  );
}
