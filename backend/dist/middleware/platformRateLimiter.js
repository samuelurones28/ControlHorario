"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformStandardRateLimit = exports.platformLoginRateLimit = void 0;
exports.setupPlatformRateLimits = setupPlatformRateLimits;
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
async function setupPlatformRateLimits(app) {
    await app.register(rate_limit_1.default, {
        global: false, // We'll apply it specifically to routes
        max: 100, // default limit
        timeWindow: '1 minute'
    });
}
// These are options to pass to specific routes
exports.platformLoginRateLimit = {
    config: {
        rateLimit: {
            max: 3,
            timeWindow: '15 minutes'
        }
    }
};
exports.platformStandardRateLimit = {
    config: {
        rateLimit: {
            max: 100,
            timeWindow: '1 minute'
        }
    }
};
