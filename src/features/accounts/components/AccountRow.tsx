import type { Account } from '@/features/accounts/types/account.types'

interface AccountRowProps {
  account: Account
  depth: 1 | 2 | 3
  onAddChild?: (parent: Account) => void
  onEdit?: (account: Account) => void
  onDelete?: (account: Account) => void
}

export function AccountRow({ account, depth, onAddChild, onEdit, onDelete }: AccountRowProps) {
  const containerStyles: Record<1 | 2 | 3, string> = {
    1: 'bg-gray-100',
    2: 'bg-white',
    3: 'bg-white',
  }

  const textStyles: Record<1 | 2 | 3, string> = {
    1: 'font-semibold text-gray-700',
    2: 'text-gray-800',
    3: 'text-gray-700',
  }

  const indentStyles: Record<1 | 2 | 3, string> = {
    1: '',
    2: 'pl-4',
    3: 'pl-8',
  }

  return (
    <div
      className={['flex items-center justify-between px-4 py-2.5', containerStyles[depth]].join(
        ' '
      )}
    >
      <div className={['flex items-center gap-2', indentStyles[depth]].join(' ')}>
        <span className="font-mono text-xs text-gray-400">{account.code}</span>
        <span className={textStyles[depth]}>{account.name}</span>
      </div>

      <div className="flex items-center gap-1">
        {depth === 2 && onAddChild && (
          <button
            onClick={() => onAddChild(account)}
            className="rounded px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
          >
            + Agregar subcuenta
          </button>
        )}

        {depth === 3 && onEdit && (
          <button
            onClick={() => onEdit(account)}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
            aria-label={`Editar ${account.name}`}
          >
            <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
            </svg>
          </button>
        )}

        {depth === 3 && onDelete && (
          <button
            onClick={() => onDelete(account)}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
            aria-label={`Eliminar ${account.name}`}
          >
            <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C9.327 4.025 10.168 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
