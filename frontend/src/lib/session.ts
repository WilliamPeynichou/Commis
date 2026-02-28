const SESSION_KEY = 'commis_session_id';

/**
 * Returns the anonymous session UUID for this browser.
 * Creates and persists one on first call via localStorage.
 */
export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
