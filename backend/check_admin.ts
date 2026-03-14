import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const admin = await prisma.platformAdmin.findUnique({ where: { email: 'admin@controlhorario.es' } })
  console.log(admin ? 'Admin found: ' + JSON.stringify(admin) : 'Admin not found')
}
main().finally(() => prisma.$disconnect())
