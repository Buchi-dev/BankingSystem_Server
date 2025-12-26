import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
  } from '@tanstack/react-table';
  import { useState } from 'react';
  
  export function UsersTable({ data }) {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
  
    // 1. DEFINE COLUMNS
    const columns = [
      {
        header: 'Name',
        accessorFn: (row) => `${row.fullName.firstName} ${row.fullName.lastName}`, // Combine names
      },
      {
        header: 'Email',
        accessorKey: 'email',
      },
      {
        header: 'Role',
        accessorKey: 'role',
        cell: (info) => {
          const role = info.getValue();
          const colors = {
            admin: 'bg-red-100 text-red-800',
            staff: 'bg-purple-100 text-purple-800',
            user: 'bg-blue-100 text-blue-800',
          };
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${colors[role] || 'bg-gray-100'}`}>
              {role}
            </span>
          );
        },
      },
      {
        header: 'Balance',
        accessorFn: (row) => row.wallet?.balance?.$numberDecimal || '0.00', // Handle nested decimal
        cell: (info) => <span className="font-mono">₱{Number(info.getValue()).toFixed(2)}</span>,
      },
      {
        header: 'Status',
        accessorKey: 'isVerified',
        cell: (info) => (
          info.getValue() 
            ? <span className="text-green-600 font-bold">Verified</span> 
            : <span className="text-gray-400 italic">Unverified</span>
        ),
      },
      {
        header: 'Joined',
        accessorKey: 'createdAt',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
    ];
  
    // 2. INITIALIZE TABLE ENGINE
    const table = useReactTable({
      data,
      columns,
      state: { sorting, globalFilter },
      onSortingChange: setSorting,
      onGlobalFilterChange: setGlobalFilter,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
    });
  
    return (
      <div className="space-y-4">
        {/* SEARCH BAR */}
        <input
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search users..."
          className="p-2 border rounded w-full max-w-sm"
        />
  
        {/* TABLE */}
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {/* Sorting Arrow */}
                      {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50 transition">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* PAGINATION */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-gray-500 text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="space-x-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }
  