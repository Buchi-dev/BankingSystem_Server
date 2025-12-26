import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { bankingApi } from '../../api/banking'; // Import Real API
import { TransactionsTable } from '../../components/tables/TransactionsTable';
import { TransferForm } from '../../components/forms/TransferForm';

// 1. DATA LOADING CONFIGURATION
// We define these options outside so both the Loader and the Hook use the exact same key.
const balanceQueryOpts = {
  queryKey: ['balance'],
  queryFn: bankingApi.getBalance,
  refetchInterval: 5000, // Poll every 5s for live updates
};

const transactionsQueryOpts = {
  queryKey: ['transactions'],
  queryFn: bankingApi.getTransactions,
};

// 2. THE ROUTE DEFINITION
export const Route = createFileRoute('/_authenticated/dashboard')({
  // The Loader ensures data starts fetching BEFORE the page renders
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(balanceQueryOpts),
      queryClient.ensureQueryData(transactionsQueryOpts),
    ]);
  },
  component: Dashboard,
});

// 3. THE COMPONENT
function Dashboard() {
  // Use the same options as the loader to get the cached data instantly
  const { data: balance, isLoading: isBalanceLoading } = useQuery(balanceQueryOpts);
  const { data: transactions, isLoading: isTxLoading } = useQuery(transactionsQueryOpts);

  if (isBalanceLoading || isTxLoading) {
    return <div className="p-10 text-center">Loading Banking System...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>

      {/* TOP ROW: Balance + Transfer Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT: Balance Card */}
        <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-center relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
          
          <h2 className="text-gray-400 uppercase text-sm tracking-wider font-semibold">Total Balance</h2>
          <div className="text-5xl font-bold mt-4">
            ${balance?.amount?.toLocaleString() ?? '0.00'} 
            <span className="text-xl text-gray-500 ml-2">{balance?.currency || 'USD'}</span>
          </div>
          <div className="mt-6 text-sm text-green-400 flex items-center gap-2">
             ● Live System Active
          </div>
        </div>

        {/* RIGHT: Transfer Form */}
        <TransferForm />
      </div>

      {/* BOTTOM ROW: Transactions Table */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Transactions</h3>
        {transactions?.length > 0 ? (
          <TransactionsTable data={transactions} />
        ) : (
          <p className="text-gray-500 italic">No recent transactions found.</p>
        )}
      </div>
    </div>
  );
}
