'use client'

const PAGE_SIZE_DEFAULT = 20

interface TablePaginationProps {
  totalItems: number
  pageSize?: number
  page: number
  onPageChange: (page: number) => void
}

export default function TablePagination({
  totalItems,
  pageSize = PAGE_SIZE_DEFAULT,
  page,
  onPageChange,
}: TablePaginationProps) {
  if (totalItems <= pageSize) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const rangeStart = (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, totalItems)

  const btnClass =
    'min-h-10 rounded-lg border border-line bg-card px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:py-1.5'

  return (
    <div className="flex flex-col gap-3 border-t border-line-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-fg-subtle">
        Mostrando {rangeStart}–{rangeEnd} de {totalItems}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-sm text-fg-subtle">
          Página {safePage} de {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className={btnClass}
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          className={btnClass}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export { PAGE_SIZE_DEFAULT as TABLE_PAGE_SIZE }
