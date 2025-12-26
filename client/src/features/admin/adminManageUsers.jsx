import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/user'; // Your API file
import { UsersTable } from '../../components/tables/UsersTable'; // Import Table

export function AdminManageUsers() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: userApi.getAllUsers, // This should return the array [ {...}, {...} ]
  });

  if (isLoading) return <div className="p-10 text-center">Loading Users...</div>;
  if (isError) return <div className="p-10 text-red-500">Error loading users.</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      {/* Pass the data array to the table */}
      <UsersTable data={data || []} />
    </div>
  );
}
