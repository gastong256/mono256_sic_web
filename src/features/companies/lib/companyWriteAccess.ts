type CompanyViewerAccessLike = {
  is_read_only?: boolean
  viewer_can_write?: boolean
}

export function canViewerWriteCompany(
  company: CompanyViewerAccessLike | null | undefined
): boolean {
  if (!company) return false
  if (company.viewer_can_write === false) return false
  return company.is_read_only !== true
}

export function isViewerReadOnlyCompany(
  company: CompanyViewerAccessLike | null | undefined
): boolean {
  return !canViewerWriteCompany(company)
}
