import type { ReactNode } from 'react';

type TableColumn<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => ReactNode;
};

type SimpleTableProps<T extends { id: string }> = {
  columns: TableColumn<T>[];
  rows: T[];
};

export function SimpleTable<T extends { id: string }>({ columns, rows }: SimpleTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-700 dark:bg-slate-900/70">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50/90 dark:bg-slate-800/80">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-200/70 dark:border-slate-700/70">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {column.render ? column.render(row) : String(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
