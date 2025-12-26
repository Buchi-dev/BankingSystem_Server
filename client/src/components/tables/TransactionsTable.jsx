import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

export function TransactionsTable({ data }) {
  const columns = [
    { header: 'Date', accessorKey: 'date' },
    { header: 'Recipient', accessorKey: 'recipient' },
    { header: 'Type', accessorKey: 'type' },
    { 
      header: 'Amount', 
      accessorKey: 'amount',
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className={val < 0 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
            {val < 0 ? '-' : '+'}${Math.abs(val)}
          </span>
        );
      }
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-100 border-b">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="p-3">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="p-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
