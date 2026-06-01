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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-t border-gray-100">
      <p className="text-[12px] text-gray-500">
        Mostrando {rangeStart}–{rangeEnd} de {totalItems}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-gray-500">
          Página {safePage} de {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          className="px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export { PAGE_SIZE_DEFAULT as TABLE_PAGE_SIZE }
