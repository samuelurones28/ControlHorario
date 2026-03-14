import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import crypto from 'crypto'

export class TotpService {
  /**
   * Generates a new TOTP secret and QR code URL for initial setup
   */
  static async generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `Control Horario Platform (${email})`
    })

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!)

    return {
      secret: secret.base32,
      qrCodeUrl
    }
  }

  /**
   * Verifies a TOTP code against a secret
   */
  static verify(secret: string, token: string) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step (30s) variance in case of clock drift
    })
  }

  /**
   * Generates backup codes (10 codes of 8 characters each)
   */
  static generateBackupCodes(): string[] {
    const codes: string[] = []
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
    }
    return codes
  }
}
