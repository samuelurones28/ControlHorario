"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRateLimiter = loginRateLimiter;
exports.clearLoginAttempts = clearLoginAttempts;
exports.getLoginAttempts = getLoginAttempts;
// In-memory store for login attempts (in production, use Redis)
const loginAttempts = new Map();
// Configuration
const MAX_ATTEMPTS = 5; // Max 5 login attempts
const TIME_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const BLOCK_DURATION = 15 * 60 * 1000; // Block for 15 minutes
/**
 * Rate limiter middleware for login endpoints
 * Prevents brute force attacks by limiting login attempts per IP/identifier
 *
 * Usage: app.post('/login', { preHandler: loginRateLimiter }, handler)
 */
async function loginRateLimiter(request, reply) {
    const ipAddress = request.ip || 'unknown';
    // For employee login, also consider the identifier (email/code)
    const identifier = request.body?.email || request.body?.companyCode || '';
    const key = `${ipAddress}:${identifier}`;
    const now = Date.now();
    const attempt = loginAttempts.get(key);
    if (attempt) {
        // Check if time window has passed
        if (now > attempt.resetTime) {
            // Reset counter
            loginAttempts.set(key, { count: 1, resetTime: now + TIME_WINDOW });
        }
        else {
            // Increment counter
            if (attempt.count >= MAX_ATTEMPTS) {
                // Too many attempts
                const remainingTime = Math.ceil((attempt.resetTime - now) / 1000);
                return reply.status(429).send({
                    error: 'Too Many Login Attempts',
                    message: `Too many login attempts. Please try again in ${remainingTime} seconds.`,
                    retryAfter: remainingTime,
                });
            }
            attempt.count += 1;
        }
    }
    else {
        // First attempt
        loginAttempts.set(key, { count: 1, resetTime: now + TIME_WINDOW });
    }
    // Cleanup old entries periodically (every ~100 requests)
    if (Math.random() < 0.01) {
        const now = Date.now();
        const keysToDelete = [];
        loginAttempts.forEach((v, k) => {
            if (now > v.resetTime) {
                keysToDelete.push(k);
            }
        });
        keysToDelete.forEach(k => loginAttempts.delete(k));
    }
}
/**
 * Clear login attempts for a specific IP (call after successful login)
 */
function clearLoginAttempts(ipAddress, identifier) {
    const key = identifier ? `${ipAddress}:${identifier}` : ipAddress;
    loginAttempts.delete(key);
}
/**
 * Get remaining attempts for debugging/logging
 */
function getLoginAttempts(ipAddress, identifier) {
    const key = identifier ? `${ipAddress}:${identifier}` : ipAddress;
    const attempt = loginAttempts.get(key);
    if (!attempt || Date.now() > attempt.resetTime) {
        return MAX_ATTEMPTS;
    }
    return Math.max(0, MAX_ATTEMPTS - attempt.count);
}
