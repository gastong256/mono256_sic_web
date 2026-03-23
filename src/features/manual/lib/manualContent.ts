import manualData from '@/features/manual/data/manual.json'
import type { Role } from '@/shared/types'
import type { ManualData, ManualFlow, ManualRole } from '@/features/manual/types/manual.types'

const data = manualData as ManualData

export const manualMeta = data.meta
export const manualFlows = data.flows
export const manualRoles = data.roles

export function getManualRoleById(roleId: string): ManualRole | undefined {
  return manualRoles.find((role) => role.id === roleId)
}

export function getManualFlowById(flowId: string): ManualFlow | undefined {
  return manualFlows.find((flow) => flow.id === flowId)
}

export function getManualScreenshotSrc(path: string | null): string | null {
  if (!path) return null
  return `/manual-screenshots/${path}`
}

export function normalizeManualText(value: string): string {
  return value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function getAllowedManualRoleIds(userRole: Role | null | undefined): string[] {
  if (userRole === 'student') return ['alumno']
  if (userRole === 'teacher') return ['alumno', 'docente']
  if (userRole === 'admin') return manualRoles.map((role) => role.id)
  return []
}

export function renderInlineEmphasis(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return {
        key: `manual-rich-${index}`,
        strong: true,
        text: part.slice(2, -2),
      }
    }

    return {
      key: `manual-rich-${index}`,
      strong: false,
      text: part,
    }
  })
}
