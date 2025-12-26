import { createFileRoute } from '@tanstack/react-router'
import { AdminManageUsers } from '../../features/admin/adminManageUsers'

export const Route = createFileRoute('/admin/ManageUsers')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AdminManageUsers />
}
