import { createFileRoute } from '@tanstack/react-router'
import { RegisterPage } from '../../features/auth/Register'

export const Route = createFileRoute('/_auth/Register')({
  component: RouteComponent,
})

function RouteComponent() {
  return <RegisterPage />
}
