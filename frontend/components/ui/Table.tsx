'use client'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string | number
  emptyMessage?: string
}

export default function Table<T>({ columns, data, keyExtractor, emptyMessage = 'No hay registros.' }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-muted/50 py-16 text-center text-fg-subtle">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-3 h-10 w-10 text-fg-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-fg-subtle ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-subtle">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className="transition-colors hover:bg-muted"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3.5 text-fg-strong ${col.className || ''}`}>
                  {col.render
                    ? col.render(item)
                    : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export type { Column }
