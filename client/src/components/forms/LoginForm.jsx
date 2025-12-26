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
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="name@smu.edu.ph"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors ? (
              <p className="mt-1 text-sm text-red-600">
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
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors ? (
              <p className="mt-1 text-sm text-red-600">
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
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}
