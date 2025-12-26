import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { userApi } from '../../api/user'; // Ensure this path is correct

export function LoginForm() {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: userApi.login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      navigate({ to: '/dashboard' });
    },
    onError: (err) => alert(`Login Failed: ${err.message}`),
  });

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* EMAIL FIELD */}
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => !value ? 'Email is required' : undefined,
        }}
      >
        {(field) => (
          <div>
            <label>
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@smu.edu.ph"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors ? (
              <p>
                {field.state.meta.errors.join(', ')}
              </p>
            ) : null}
          </div>
        )}
      </form.Field>

      {/* PASSWORD FIELD */}
      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => !value ? 'Password is required' : undefined,
        }}
      >
        {(field) => (
          <div>
            <label>
              Password
            </label>
            <input
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors ? (
              <p>
                {field.state.meta.errors.join(', ')}
              </p>
            ) : null}
          </div>
        )}
      </form.Field>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}
