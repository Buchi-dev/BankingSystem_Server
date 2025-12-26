import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { userApi } from '../../api/user';

export function LoginForm() {
    const navigate = useNavigate();

    const loginMutation = useMutation({
        mutationFn: userApi.login,
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            navigate({ to: '/dashboard' });
        },
        onError: (err) => alert(err.message),
    });

    const form = useForm({
        defaultValues: { email: '', password: '' },
        onSubmit: async ({ value }) => await loginMutation.mutateAsync(value),
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
            className="space-y-5"
        >
            {/* ... (Fields for Email and Password go here, same as before) ... */}
            <div className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={form.state.values.email}
                        onChange={(e) => form.handleChange('email', e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={form.state.values.password}
                        onChange={(e) => form.handleChange('password', e.target.value)}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-slate-900 text-white py-3 rounded-lg disabled:opacity-50"
            >
                {loginMutation.isPending ? 'Authenticating...' : 'Sign In'}
            </button>
        </form>
    );
}
