import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ActiveCompanyState {
  activeCompanyId: number | null
  setActiveCompanyId: (id: number | null) => void
}

export const useActiveCompanyStore = create<ActiveCompanyState>()(
  persist(
    (set) => ({
      activeCompanyId: null,
      setActiveCompanyId: (id) => set({ activeCompanyId: id }),
    }),
    { name: 'active-company-storage' }
  )
)
