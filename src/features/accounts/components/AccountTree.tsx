import { AccountRow } from '@/features/accounts/components/AccountRow'
import type { Account } from '@/features/accounts/types/account.types'

interface AccountTreeProps {
  accounts: Account[]
  onAddChild: (parent: Account) => void
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
}

export function AccountTree({ accounts, onAddChild, onEdit, onDelete }: AccountTreeProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="divide-y divide-gray-100">
        {accounts.map((level1) => (
          <div key={level1.id}>
            <AccountRow account={level1} depth={1} />
            {level1.children?.map((level2) => (
              <div key={level2.id}>
                <AccountRow account={level2} depth={2} onAddChild={onAddChild} />
                {level2.children?.map((level3) => (
                  <AccountRow
                    key={level3.id}
                    account={level3}
                    depth={3}
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
