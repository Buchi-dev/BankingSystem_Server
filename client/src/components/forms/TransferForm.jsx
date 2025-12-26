import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bankingApi } from '../../api/banking'; // Import Real API

export function TransferForm() {
  const queryClient = useQueryClient();

  // 1. MUTATION: Sends data to server
  const transferMutation = useMutation({
    mutationFn: bankingApi.sendMoney,
    onSuccess: () => {
      // SUCCESS!
      // 1. Refresh Balance immediately
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      // 2. Refresh Transaction History
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      alert('Money sent successfully!');
    },
    onError: (error) => {
      // ERROR!
      alert(`Transfer Failed: ${error.message}`);
    },
  });

  // 2. FORM: Handles Input State & Validation
  const form = useForm({
    defaultValues: {
      recipient: '',
      amount: 0,
    },
    onSubmit: async ({ value }) => {
      // Only runs if validation passes
      await transferMutation.mutateAsync(value);
      form.reset(); // Clear inputs after success
    },
  });

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm h-full flex flex-col justify-center">
      <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Quick Transfer</h3>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {/* RECIPIENT FIELD */}
        <form.Field
          name="recipient"
          validators={{
            onChange: ({ value }) => !value ? 'Recipient is required' : undefined,
          }}
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient ID / Name</label>
              <input
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="Enter Name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors ? (
                <p className="text-red-500 text-xs mt-1 font-medium">{field.state.meta.errors}</p>
              ) : null}
            </div>
          )}
        />

        {/* AMOUNT FIELD */}
        <form.Field
          name="amount"
          validators={{
            onChange: ({ value }) => value < 1 ? 'Minimum amount is $1' : undefined,
          }}
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input
                type="number"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="0.00"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
              {field.state.meta.errors ? (
                <p className="text-red-500 text-xs mt-1 font-medium">{field.state.meta.errors}</p>
              ) : null}
            </div>
          )}
        />

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={transferMutation.isPending}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all
            ${transferMutation.isPending 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
        >
          {transferMutation.isPending ? 'Processing Transfer...' : 'Send Money Now'}
        </button>
      </form>
    </div>
  );
}
