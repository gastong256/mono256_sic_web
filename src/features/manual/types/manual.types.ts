export interface ManualRole {
  id: string
  label: string
  color: string
  icon: string
}

export interface FlowStep {
  id: string
  title: string
  description: string
  screenshot: string | null
  tip: string | null
}

export interface ManualFlow {
  id: string
  title: string
  description: string
  roles: string[]
  icon: string
  estimatedTime: string
  tags?: string[]
  steps: FlowStep[]
}

export interface ManualMeta {
  version: string
  title: string
  description: string
  lastUpdated: string
}

export interface ManualData {
  meta: ManualMeta
  roles: ManualRole[]
  flows: ManualFlow[]
}
