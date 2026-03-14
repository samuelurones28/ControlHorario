"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TotpService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
class TotpService {
    /**
     * Generates a new TOTP secret and QR code URL for initial setup
     */
    static async generateSecret(email) {
        const secret = speakeasy_1.default.generateSecret({
            name: `Control Horario Platform (${email})`
        });
        const qrCodeUrl = await qrcode_1.default.toDataURL(secret.otpauth_url);
        return {
            secret: secret.base32,
            qrCodeUrl
        };
    }
    /**
     * Verifies a TOTP code against a secret
     */
    static verify(secret, token) {
        return speakeasy_1.default.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 1 // Allow 1 step (30s) variance in case of clock drift
        });
    }
    /**
     * Generates backup codes (10 codes of 8 characters each)
     */
    static generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto_1.default.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
}
exports.TotpService = TotpService;
