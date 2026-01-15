// Session timeout manager for automatic logout on inactivity
// Tracks user activity and triggers warnings/logout when session expires

const SESSION_CHECK_INTERVAL = 60000 // Check every 1 minute
const WARNING_TIME = 60 * 60 * 1000 // Show warning 60 minutes (1 hour) before expiry
const SESSION_LIFETIME = 120 * 60 * 1000 // 120 minutes (2 hours) in milliseconds (matches backend)

export class SessionManager {
  private static instance: SessionManager
  private lastActivity: number = Date.now()
  private checkInterval: NodeJS.Timeout | null = null
  private onSessionExpired?: () => void
  private onSessionWarning?: (remainingSeconds: number) => void
  private warningShown: boolean = false

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }

    return SessionManager.instance
  }

  // Initialize session manager with callbacks
  init(callbacks: { onExpired?: () => void; onWarning?: (remainingSeconds: number) => void }) {
    this.onSessionExpired = callbacks.onExpired
    this.onSessionWarning = callbacks.onWarning

    // Get last activity from localStorage (in case of page reload)
    const storedActivity = localStorage.getItem('last_activity')

    if (storedActivity) {
      this.lastActivity = parseInt(storedActivity, 10)
    } else {
      this.updateActivity()
    }

    // Track user activity
    this.setupActivityTracking()

    // Start session check
    this.startSessionCheck()
  }

  // Setup activity tracking
  private setupActivityTracking() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), { passive: true })
    })
  }

  // Update last activity timestamp
  updateActivity() {
    this.lastActivity = Date.now()
    this.warningShown = false
    localStorage.setItem('last_activity', this.lastActivity.toString())
  }

  // Start checking session expiry
  private startSessionCheck() {
    this.checkInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity
      const remainingTime = SESSION_LIFETIME - timeSinceLastActivity

      // Session expired
      if (remainingTime <= 0) {
        this.handleSessionExpired()
      }
      // Show warning (only once)
      else if (remainingTime <= WARNING_TIME && remainingTime > 0 && !this.warningShown) {
        const remainingSeconds = Math.floor(remainingTime / 1000)

        this.warningShown = true
        this.onSessionWarning?.(remainingSeconds)
      }
    }, SESSION_CHECK_INTERVAL)
  }

  // Handle session expiration
  private handleSessionExpired() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.onSessionExpired?.()
  }

  // Stop session manager
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }

  // Get remaining session time in seconds
  getRemainingTime(): number {
    const timeSinceLastActivity = Date.now() - this.lastActivity
    const remainingTime = SESSION_LIFETIME - timeSinceLastActivity

    return Math.max(0, Math.floor(remainingTime / 1000))
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  }
}
