import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { userApi } from '../../api/user'; // Ensure this path matches your project

export function RegisterForm() {
    const navigate = useNavigate();

    const registerMutation = useMutation({
        mutationFn: userApi.register,
        onSuccess: (data) => {
            // Navigate to login page on success
            // localStorage.setItem('token', data.token);
            navigate({ to: '/login' });
        },
        onError: (err) => alert(`Registration Error: ${err.message}`),
    });

    const form = useForm({
        defaultValues: {
            firstName: '',
            lastName: '',
            middleInitial: '',
            email: '',
            password: '',
        },
        onSubmit: async ({ value }) => {
            // Transform flat form data to API nested structure
            const apiPayload = {
                fullName: {
                    firstName: value.firstName,
                    lastName: value.lastName,
                    middleInitial: value.middleInitial || undefined, // Optional
                },
                email: value.email,
                password: value.password,
            };

            await registerMutation.mutateAsync(apiPayload);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* NAME ROW */}
            <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <form.Field name="firstName" validators={{ onChange: ({value}) => !value ? 'Required' : undefined }}>
                    {(field) => (
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                id="firstName"
                                className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors && <p className="text-red-500 text-xs">{field.state.meta.errors}</p>}
                        </div>
                    )}
                </form.Field>

                {/* Last Name */}
                <form.Field name="lastName" validators={{ onChange: ({value}) => !value ? 'Required' : undefined }}>
                    {(field) => (
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                id="lastName"
                                className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                             {field.state.meta.errors && <p className="text-red-500 text-xs">{field.state.meta.errors}</p>}
                        </div>
                    )}
                </form.Field>
            </div>

            {/* Middle Initial (Optional) */}
            <form.Field name="middleInitial" validators={{ onChange: ({value}) => value.length > 1 ? '1 char only' : undefined }}>
                {(field) => (
                    <div>
                        <label htmlFor="middleInitial" className="block text-sm font-medium text-gray-700">Middle Initial (Optional)</label>
                        <input
                            id="middleInitial"
                            className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            maxLength={1}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                        />
                         {field.state.meta.errors && <p className="text-red-500 text-xs">{field.state.meta.errors}</p>}
                    </div>
                )}
            </form.Field>

            {/* Email */}
            <form.Field name="email" validators={{ onChange: ({value}) => !value.endsWith('@smu.edu.ph') ? 'Must be @smu.edu.ph' : undefined }}>
                {(field) => (
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">School Email</label>
                        <input
                            type="email"
                            id="email"
                            className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors && <p className="text-red-500 text-xs">{field.state.meta.errors}</p>}
                    </div>
                )}
            </form.Field>

            {/* Password */}
            <form.Field name="password" validators={{ onChange: ({value}) => value.length < 6 ? 'Min 6 chars' : undefined }}>
                {(field) => (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                         {field.state.meta.errors && <p className="text-red-500 text-xs">{field.state.meta.errors}</p>}
                    </div>
                )}
            </form.Field>

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={registerMutation.isPending} 
                className="w-full bg-slate-900 text-white py-3 rounded-lg disabled:opacity-50 hover:bg-slate-800 transition"
            >
                {registerMutation.isPending ? 'Creating Account...' : 'Register'}
            </button>
        </form>
    );
}
