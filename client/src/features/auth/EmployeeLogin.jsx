import { EmployeeLoginForm } from '../../components/forms/EmployeeLoginForm';

export function EmployeeLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Employee Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your employee account
          </p>
        </div>
        <EmployeeLoginForm />
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Not an employee? <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">User Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}