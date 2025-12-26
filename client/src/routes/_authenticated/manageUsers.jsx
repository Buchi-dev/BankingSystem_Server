import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboard } from '../../features/admin/AdminDashboard'
export const Route = createFileRoute('/_authenticated/manageUsers')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AdminDashboard />
}
