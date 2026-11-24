import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, total, onChange }: {
  page: number
  total: number
  onChange: (page: number) => void
}) {
  if (total <= 1) return null
  const start = Math.max(2, Math.min(page - 1, total - 3))
  const end = Math.min(total - 1, start + 2)
  const numbers = [1, ...Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index), total]

  return (
    <nav className="pagination" aria-label="Страницы каталога">
      <button type="button" className="icon-button" disabled={page === 1} aria-label="Предыдущая страница"
        onClick={() => onChange(page - 1)}><ChevronLeft size={20} aria-hidden="true" /></button>
      {numbers.map((number, index) => (
        <span className="pagination-item" key={number}>
          {index > 0 && number - numbers[index - 1] > 1 && <span aria-hidden="true">…</span>}
          <button type="button" className="icon-button" aria-label={`Страница ${number}`}
            aria-current={number === page ? 'page' : undefined} onClick={() => onChange(number)}>{number}</button>
        </span>
      ))}
      <button type="button" className="icon-button" disabled={page === total} aria-label="Следующая страница"
        onClick={() => onChange(page + 1)}><ChevronRight size={20} aria-hidden="true" /></button>
    </nav>
  )
}
