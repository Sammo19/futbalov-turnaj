// Generate a unique session ID for anonymous users
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const SESSION_KEY = 'challonge_session_id';
  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    // Generate a random session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

export function clearSessionId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const SESSION_KEY = 'challonge_session_id';
  localStorage.removeItem(SESSION_KEY);
}

// Username is now stored in database, not localStorage
