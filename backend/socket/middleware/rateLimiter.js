// Rate Limiter Middleware for Socket.IO - LegalPro v1.0.1
const { RATE_LIMITS } = require('../events/socketEvents');

class SocketRateLimiter {
  constructor() {
    this.userLimits = new Map(); // userId -> { eventType -> { count, resetTime, blocked } }
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  // Main middleware function
  middleware(socket, next) {
    const userId = socket.userId;
    
    if (!userId) {
      return next(new Error('User ID required for rate limiting'));
    }

    // Initialize user limits if not exists
    if (!this.userLimits.has(userId)) {
      this.userLimits.set(userId, new Map());
    }

    // Add rate limiting to socket events
    this.wrapSocketEvents(socket);
    
    next();
  }

  wrapSocketEvents(socket) {
    const originalEmit = socket.emit;
    const originalOn = socket.on;
    
    // Override socket.on to add rate limiting
    socket.on = (eventName, handler) => {
      const wrappedHandler = (...args) => {
        if (this.isRateLimited(socket.userId, eventName)) {
          socket.emit('rate_limit_exceeded', {
            event: eventName,
            message: 'Rate limit exceeded. Please slow down.',
            retryAfter: this.getRetryAfter(socket.userId, eventName)
          });
          return;
        }

        this.recordEvent(socket.userId, eventName);
        return handler(...args);
      };

      return originalOn.call(socket, eventName, wrappedHandler);
    };
  }

  isRateLimited(userId, eventName) {
    const rateLimit = RATE_LIMITS[eventName];
    if (!rateLimit) {
      return false; // No rate limit defined for this event
    }

    const userLimits = this.userLimits.get(userId);
    if (!userLimits) {
      return false;
    }

    const eventLimit = userLimits.get(eventName);
    if (!eventLimit) {
      return false;
    }

    const now = Date.now();

    // Check if user is currently blocked
    if (eventLimit.blocked && now < eventLimit.blockedUntil) {
      return true;
    }

    // Reset if time window has passed
    if (now >= eventLimit.resetTime) {
      eventLimit.count = 0;
      eventLimit.resetTime = now + (rateLimit.duration * 1000);
      eventLimit.blocked = false;
      eventLimit.blockedUntil = 0;
    }

    // Check if limit is exceeded
    if (eventLimit.count >= rateLimit.points) {
      eventLimit.blocked = true;
      eventLimit.blockedUntil = now + (rateLimit.blockDuration * 1000);
      return true;
    }

    return false;
  }

  recordEvent(userId, eventName) {
    const rateLimit = RATE_LIMITS[eventName];
    if (!rateLimit) {
      return; // No rate limit defined for this event
    }

    const userLimits = this.userLimits.get(userId);
    const now = Date.now();

    if (!userLimits.has(eventName)) {
      userLimits.set(eventName, {
        count: 1,
        resetTime: now + (rateLimit.duration * 1000),
        blocked: false,
        blockedUntil: 0
      });
    } else {
      const eventLimit = userLimits.get(eventName);
      
      // Reset if time window has passed
      if (now >= eventLimit.resetTime) {
        eventLimit.count = 1;
        eventLimit.resetTime = now + (rateLimit.duration * 1000);
        eventLimit.blocked = false;
        eventLimit.blockedUntil = 0;
      } else {
        eventLimit.count++;
      }
    }
  }

  getRetryAfter(userId, eventName) {
    const userLimits = this.userLimits.get(userId);
    if (!userLimits) {
      return 0;
    }

    const eventLimit = userLimits.get(eventName);
    if (!eventLimit) {
      return 0;
    }

    if (eventLimit.blocked) {
      return Math.max(0, eventLimit.blockedUntil - Date.now());
    }

    return Math.max(0, eventLimit.resetTime - Date.now());
  }

  // Get current usage for a user and event
  getUsage(userId, eventName) {
    const userLimits = this.userLimits.get(userId);
    if (!userLimits) {
      return { count: 0, limit: RATE_LIMITS[eventName]?.points || 0, resetTime: 0 };
    }

    const eventLimit = userLimits.get(eventName);
    if (!eventLimit) {
      return { count: 0, limit: RATE_LIMITS[eventName]?.points || 0, resetTime: 0 };
    }

    return {
      count: eventLimit.count,
      limit: RATE_LIMITS[eventName]?.points || 0,
      resetTime: eventLimit.resetTime,
      blocked: eventLimit.blocked,
      blockedUntil: eventLimit.blockedUntil
    };
  }

  // Reset limits for a specific user (admin function)
  resetUserLimits(userId, eventName = null) {
    const userLimits = this.userLimits.get(userId);
    if (!userLimits) {
      return false;
    }

    if (eventName) {
      userLimits.delete(eventName);
    } else {
      userLimits.clear();
    }

    return true;
  }

  // Get all users currently rate limited
  getRateLimitedUsers() {
    const rateLimitedUsers = [];
    const now = Date.now();

    for (const [userId, userLimits] of this.userLimits.entries()) {
      for (const [eventName, eventLimit] of userLimits.entries()) {
        if (eventLimit.blocked && now < eventLimit.blockedUntil) {
          rateLimitedUsers.push({
            userId,
            eventName,
            blockedUntil: eventLimit.blockedUntil,
            count: eventLimit.count,
            limit: RATE_LIMITS[eventName]?.points || 0
          });
        }
      }
    }

    return rateLimitedUsers;
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    const usersToDelete = [];

    for (const [userId, userLimits] of this.userLimits.entries()) {
      const eventsToDelete = [];

      for (const [eventName, eventLimit] of userLimits.entries()) {
        // Remove expired blocks and reset times
        if (now >= eventLimit.resetTime && !eventLimit.blocked) {
          eventsToDelete.push(eventName);
        } else if (eventLimit.blocked && now >= eventLimit.blockedUntil) {
          eventLimit.blocked = false;
          eventLimit.blockedUntil = 0;
          eventLimit.count = 0;
          eventLimit.resetTime = now + (RATE_LIMITS[eventName]?.duration * 1000 || 60000);
        }
      }

      // Remove expired event limits
      for (const eventName of eventsToDelete) {
        userLimits.delete(eventName);
      }

      // Remove user if no active limits
      if (userLimits.size === 0) {
        usersToDelete.push(userId);
      }
    }

    // Remove users with no active limits
    for (const userId of usersToDelete) {
      this.userLimits.delete(userId);
    }
  }

  // Get statistics
  getStats() {
    const stats = {
      totalUsers: this.userLimits.size,
      totalEvents: 0,
      blockedUsers: 0,
      eventBreakdown: {}
    };

    const now = Date.now();

    for (const [userId, userLimits] of this.userLimits.entries()) {
      let userBlocked = false;

      for (const [eventName, eventLimit] of userLimits.entries()) {
        stats.totalEvents++;

        if (!stats.eventBreakdown[eventName]) {
          stats.eventBreakdown[eventName] = {
            totalUsers: 0,
            blockedUsers: 0,
            totalRequests: 0
          };
        }

        stats.eventBreakdown[eventName].totalUsers++;
        stats.eventBreakdown[eventName].totalRequests += eventLimit.count;

        if (eventLimit.blocked && now < eventLimit.blockedUntil) {
          stats.eventBreakdown[eventName].blockedUsers++;
          userBlocked = true;
        }
      }

      if (userBlocked) {
        stats.blockedUsers++;
      }
    }

    return stats;
  }

  // Destroy the rate limiter
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.userLimits.clear();
  }
}

// Create singleton instance
const rateLimiterInstance = new SocketRateLimiter();

// Export middleware function
const rateLimiter = (socket, next) => {
  return rateLimiterInstance.middleware(socket, next);
};

// Export additional functions for management
rateLimiter.getInstance = () => rateLimiterInstance;
rateLimiter.getUsage = (userId, eventName) => rateLimiterInstance.getUsage(userId, eventName);
rateLimiter.resetUserLimits = (userId, eventName) => rateLimiterInstance.resetUserLimits(userId, eventName);
rateLimiter.getRateLimitedUsers = () => rateLimiterInstance.getRateLimitedUsers();
rateLimiter.getStats = () => rateLimiterInstance.getStats();

module.exports = { rateLimiter };
