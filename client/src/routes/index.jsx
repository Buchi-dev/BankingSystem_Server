import { createFileRoute } from '@tanstack/react-router';
import { LoginForm } from '../components/forms/LoginForm'
import { RegisterForm } from '../components/forms/RegisterForm'
import { EmployeeLoginForm } from '../components/forms/EmployeeLoginForm';



export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div>
      <LoginForm />
      <RegisterForm />
      <EmployeeLoginForm />
    </div>
  );
}
