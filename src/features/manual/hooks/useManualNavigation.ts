import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  manualFlows,
  manualMeta,
  manualRoles,
  normalizeManualText,
} from '@/features/manual/lib/manualContent'
import type { ManualFlow } from '@/features/manual/types/manual.types'

function flowMatchesQuery(flow: ManualFlow, query: string): boolean {
  if (!query.trim()) return true

  const normalizedQuery = normalizeManualText(query)
  const haystack = normalizeManualText(
    [
      flow.title,
      flow.description,
      ...(flow.tags ?? []),
      ...flow.steps.flatMap((step) => [step.title, step.description, step.tip ?? '']),
    ].join(' ')
  )

  return haystack.includes(normalizedQuery)
}

export function useManualNavigation(allowedRoleIds: string[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRoleFilter, setActiveRoleFilter] = useState<string | null>(null)
  const [activeFlowId, setActiveFlowId] = useState<string | null>(searchParams.get('flow'))

  const visibleRoles = useMemo(
    () => manualRoles.filter((role) => allowedRoleIds.includes(role.id)),
    [allowedRoleIds]
  )

  const visibleFlows = useMemo(
    () =>
      manualFlows.filter((flow) => flow.roles.some((roleId) => allowedRoleIds.includes(roleId))),
    [allowedRoleIds]
  )

  const filteredFlows = useMemo(() => {
    return visibleFlows.filter((flow) => {
      if (activeRoleFilter && !flow.roles.includes(activeRoleFilter)) return false
      return flowMatchesQuery(flow, searchQuery)
    })
  }, [activeRoleFilter, searchQuery, visibleFlows])

  useEffect(() => {
    if (!activeRoleFilter) return
    if (allowedRoleIds.includes(activeRoleFilter)) return
    setActiveRoleFilter(null)
  }, [activeRoleFilter, allowedRoleIds])

  const activeFlow = useMemo(
    () => filteredFlows.find((flow) => flow.id === activeFlowId) ?? null,
    [activeFlowId, filteredFlows]
  )

  useEffect(() => {
    const flowParam = searchParams.get('flow')
    if (!flowParam) return
    if (!filteredFlows.some((flow) => flow.id === flowParam)) return
    if (flowParam === activeFlowId) return

    setActiveFlowId(flowParam)
  }, [activeFlowId, filteredFlows, searchParams])

  useEffect(() => {
    if (filteredFlows.length === 0) {
      setActiveFlowId(null)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('flow')
      setSearchParams(nextParams, { replace: true })
      return
    }

    if (activeFlowId && filteredFlows.some((flow) => flow.id === activeFlowId)) return

    const nextFlow = filteredFlows[0]
    setActiveFlowId(nextFlow.id)

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('flow', nextFlow.id)
    setSearchParams(nextParams, { replace: true })
  }, [activeFlowId, filteredFlows, searchParams, setSearchParams])

  function syncFlowParam(flowId: string | null) {
    const nextParams = new URLSearchParams(searchParams)
    if (flowId) nextParams.set('flow', flowId)
    else nextParams.delete('flow')
    setSearchParams(nextParams, { replace: true })
  }

  function selectFlow(flowId: string) {
    if (flowId === activeFlowId) return
    setActiveFlowId(flowId)
    syncFlowParam(flowId)
  }

  function resetNavigation() {
    setSearchQuery('')
    setActiveRoleFilter(null)
    const nextFlow = visibleFlows[0] ?? null
    setActiveFlowId(nextFlow?.id ?? null)
    syncFlowParam(nextFlow?.id ?? null)
  }

  return {
    meta: manualMeta,
    roles: visibleRoles,
    flows: visibleFlows,
    activeFlowId,
    activeRoleFilter,
    searchQuery,
    filteredFlows,
    activeFlow,
    setSearchQuery,
    setRoleFilter: setActiveRoleFilter,
    selectFlow,
    resetNavigation,
  }
}
