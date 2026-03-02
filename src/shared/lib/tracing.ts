import { v4 as uuidv4 } from 'uuid'

/**
 * Session-scoped request ID — generated once per page load.
 * Attached to every HTTP request via X-Request-ID header
 * and included in every log entry.
 */
const SESSION_REQUEST_ID: string = uuidv4()

export function getRequestId(): string {
  return SESSION_REQUEST_ID
}
