import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../../api/employee';

export function AdminManageEmployees() {
  const queryClient = useQueryClient();

  const { data: employees, isLoading, isError } = useQuery({
    queryKey: employeeApi.keys.all,
    queryFn: employeeApi.getAllEmployees,
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: employeeApi.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeApi.keys.all });
    },
  });

  const verifyEmployeeMutation = useMutation({
    mutationFn: employeeApi.verifyEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeApi.keys.all });
    },
  });

  if (isLoading) return <div className="p-10 text-center">Loading Employees...</div>;
  if (isError) return <div className="p-10 text-red-500">Error loading employees.</div>;

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const handleVerify = (id) => {
    verifyEmployeeMutation.mutate(id);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Verified</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees?.map((employee) => (
              <tr key={employee._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{employee._id}</td>
                <td className="px-4 py-2 border">{employee.name}</td>
                <td className="px-4 py-2 border">{employee.email}</td>
                <td className="px-4 py-2 border">{employee.role}</td>
                <td className="px-4 py-2 border">
                  {employee.isVerified ? 'Yes' : 'No'}
                </td>
                <td className="px-4 py-2 border space-x-2">
                  {!employee.isVerified && (
                    <button
                      onClick={() => handleVerify(employee._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      disabled={verifyEmployeeMutation.isPending}
                    >
                      {verifyEmployeeMutation.isPending ? 'Verifying...' : 'Verify'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(employee._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    disabled={deleteEmployeeMutation.isPending}
                  >
                    {deleteEmployeeMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {employees?.length === 0 && (
        <div className="text-center py-8 text-gray-500">No employees found.</div>
      )}
    </div>
  );
}