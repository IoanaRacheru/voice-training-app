# Auth Migration Note: Preparing for Backend Authentication

This project previously used localStorage for demo authentication. All local password and user storage logic has been removed. The frontend now only stores a userId/session flag and expects authentication to be handled by a backend authenticator (e.g., a Dockerized service).

**Key migration points:**
- No passwords or sensitive user data are stored client-side.
- `login` and `register` methods in AuthContext are placeholders for backend integration.
- After backend integration, the frontend should:
  - Send user credentials to the backend authenticator via API.
  - Store only a session token (preferred) or userId returned by the backend.
  - Fetch full user data (e.g., via a /me endpoint) after authentication.
  - Store user data in application state (not in localStorage, except optional caching).
  - Use the session token for authenticated API requests.
  - Remove any remaining demo or local authentication logic.
**Next steps:**
- Implement API calls to the backend authenticator for login, registration, and session management.
- Replace all placeholder logic in AuthContext with real API integration.
- Ensure secure token handling (prefer HTTP-only cookies or secure storage).

This note should be removed after full backend auth integration is complete.
