import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: () => (
    <>
      {/* GLOBAL LAYOUT (Navbar stays everywhere) */}
      <div className="p-2 flex gap-2 border-b mb-4">
        <Link to="/" className="[&.active]:font-bold">Home</Link>
        <Link to="/dashboard" className="[&.active]:font-bold">Dashboard</Link>
        <Link to="/manageUsers" className="[&.active]:font-bold">Manage Users</Link>
      </div>
      
      {/* Page Content Renders Here */}
      <Outlet />
      
      {/* Debug Tools (Bottom Right Corner) */}
      <TanStackRouterDevtools />
    </>
  ),
});
