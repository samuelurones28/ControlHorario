import rateLimit from '@fastify/rate-limit'
import { FastifyInstance } from 'fastify'

export async function setupPlatformRateLimits(app: FastifyInstance) {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return
  }

  await app.register(rateLimit, {
    global: false, // We'll apply it specifically to routes
    max: 100, // default limit
    timeWindow: '1 minute'
  })
}

// These are options to pass to specific routes
export const platformLoginRateLimit = process.env.NODE_ENV === 'development' ? {} : {
  config: {
    rateLimit: {
      max: 3,
      timeWindow: '15 minutes'
    }
  }
}

export const platformStandardRateLimit = {
  config: {
    rateLimit: {
      max: 100,
      timeWindow: '1 minute'
    }
  }
}
