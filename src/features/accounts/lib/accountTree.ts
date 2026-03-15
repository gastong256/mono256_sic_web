import type { Account } from '@/features/accounts/types/account.types'

export function getAccountVisualDepth(account: Account): 1 | 2 | 3 {
  if (account.level <= 0) return 1
  if (account.level === 1) return 2
  return 3
}

export function isMovementAccount(account: Account): boolean {
  return account.level === 2 && account.is_leaf
}
