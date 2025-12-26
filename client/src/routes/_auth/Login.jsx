import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '../../features/auth/Login'

export const Route = createFileRoute('/_auth/Login')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LoginPage />
}
