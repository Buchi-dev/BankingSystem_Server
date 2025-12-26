import { LoginForm } from '../../components/forms/LoginForm'; // <--- Import the component

export function LoginPage() {
  return (
    <div>
      <div>
        <h2>Welcome Back</h2>
        
        {/* Render the Component here */}
        <LoginForm />
        
        <p>
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}
