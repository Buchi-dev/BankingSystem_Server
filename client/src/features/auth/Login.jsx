import { LoginForm } from '../../components/forms/LoginForm'; // <--- Import the component

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border">
        <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
        
        {/* Render the Component here */}
        <LoginForm />
        
        <p className="mt-4 text-center text-sm">
          Don't have an account? <a href="/register" className="text-blue-600">Register</a>
        </p>
      </div>
    </div>
  );
}
