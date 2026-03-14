import { PrismaClient, PlatformRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Platform Data...')
  
  const email = process.env.PLATFORM_ADMIN_EMAIL || 'admin@controlhorario.es'
  const password = process.env.PLATFORM_ADMIN_PASSWORD || 'Oeste123!'

  const passwordHash = await bcrypt.hash(password, 10)

  // In development, generate a dummy TOTP secret to skip 2FA setup
  const isDevelopment = process.env.NODE_ENV === 'development'
  const totpSecret = isDevelopment ? 'JBSWY3DPEBLW64TMMQ======' : null

  // 1. Create first SUPER_ADMIN if it doesn't exist
  const admin = await prisma.platformAdmin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Super Administrador',
      passwordHash,
      role: PlatformRole.SUPER_ADMIN,
      active: true,
      totpSecret: totpSecret,
    },
  })

  console.log(`✅ SUPER_ADMIN ensured: ${admin.email}`)

  // 2. Default Platform Settings
  const settings = [
    { key: 'privacy_policy_version', value: '1.0.0' },
    { key: 'maintenance_mode', value: false },
    { key: 'max_employees_per_company', value: 100 },
    { key: 'default_weekly_hours', value: 40 },
  ]

  for (const setting of settings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value },
    })
  }

  console.log(`✅ Platform Settings seeded`)

  // 3. National Holidays (Spain - Fixed)
  const currentYear = new Date().getFullYear()
  const holidays = [
    { date: new Date(`${currentYear}-01-01`), name: 'Año Nuevo', region: 'ES' },
    { date: new Date(`${currentYear}-01-06`), name: 'Epifanía del Señor', region: 'ES' },
    { date: new Date(`${currentYear}-05-01`), name: 'Fiesta del Trabajo', region: 'ES' },
    { date: new Date(`${currentYear}-08-15`), name: 'Asunción de la Virgen', region: 'ES' },
    { date: new Date(`${currentYear}-10-12`), name: 'Fiesta Nacional de España', region: 'ES' },
    { date: new Date(`${currentYear}-11-01`), name: 'Todos los Santos', region: 'ES' },
    { date: new Date(`${currentYear}-12-06`), name: 'Día de la Constitución', region: 'ES' },
    { date: new Date(`${currentYear}-12-08`), name: 'Inmaculada Concepción', region: 'ES' },
    { date: new Date(`${currentYear}-12-25`), name: 'Natividad del Señor', region: 'ES' },
  ]

  for (const holiday of holidays) {
    await prisma.nationalHoliday.upsert({
      where: {
        date_region: { date: holiday.date, region: holiday.region }
      },
      update: {},
      create: holiday,
    })
  }

  console.log(`✅ National Holidays for ${currentYear} seeded`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
