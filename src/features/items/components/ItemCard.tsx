import type { Item } from '@/features/items/types/item.types'

interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      aria-label={item.title}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-900">{item.title}</h3>
        <time
          className="shrink-0 text-xs text-gray-400"
          dateTime={item.createdAt}
          title={item.createdAt}
        >
          {formattedDate}
        </time>
      </div>

      {item.description && (
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</p>
      )}

      <div className="mt-3 border-t border-gray-100 pt-2">
        <span className="font-mono text-xs text-gray-300">{item.id}</span>
      </div>
    </article>
  )
}
