import { AccountRow } from '@/features/accounts/components/AccountRow'
import type { Account } from '@/features/accounts/types/account.types'

interface AccountTreeProps {
  accounts: Account[]
  onAddChild?: (parent: Account) => void
  onEdit?: (account: Account) => void
  onDelete?: (account: Account) => void
}

export function AccountTree({ accounts, onAddChild, onEdit, onDelete }: AccountTreeProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="divide-y divide-gray-100">
        {accounts.map((rootAccount) => (
          <div key={rootAccount.id}>
            <AccountRow account={rootAccount} />
            {rootAccount.children?.map((collectiveAccount) => (
              <div key={collectiveAccount.id}>
                <AccountRow account={collectiveAccount} onAddChild={onAddChild} />
                {collectiveAccount.children?.map((movementAccount) => (
                  <AccountRow
                    key={movementAccount.id}
                    account={movementAccount}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
