"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrivacyPolicy = exports.acceptPrivacyConsent = exports.checkPrivacyConsent = void 0;
const prisma_1 = require("../../utils/prisma");
const checkPrivacyConsent = async (req, reply) => {
    const user = req.user;
    const employeeId = user.employeeId;
    // Find the latest consent signed by this employee
    const consent = await prisma_1.prisma.privacyConsent.findFirst({
        where: { employeeId },
        orderBy: { acceptedAt: 'desc' }
    });
    return reply.send({
        hasConsent: !!consent,
        latestVersion: consent?.version || null,
        acceptedAt: consent?.acceptedAt || null
    });
};
exports.checkPrivacyConsent = checkPrivacyConsent;
const acceptPrivacyConsent = async (req, reply) => {
    const user = req.user;
    const employeeId = user.employeeId;
    const { version, ipAddress } = req.body;
    const clientIp = ipAddress || req.ip || '0.0.0.0';
    const consent = await prisma_1.prisma.privacyConsent.create({
        data: {
            employeeId,
            version,
            ipAddress: clientIp,
        }
    });
    return reply.send(consent);
};
exports.acceptPrivacyConsent = acceptPrivacyConsent;
const getPrivacyPolicy = async (req, reply) => {
    const policy = `
POLÍTICA DE PRIVACIDAD - Control Horario

Última actualización: Marzo 2026

1. RESPONSABLE DEL TRATAMIENTO
Empresa: Control Horario SL
Contacto: info@controlhorario.es

2. DATOS QUE TRATAMOS
- Identificación del trabajador (nombre, DNI hashado)
- Datos de jornada laboral (fecha, hora entrada/salida, pausas)
- Información de empresa (CIF, dirección)
- Dirección IP y datos de dispositivo (opcional)
- Consentimiento RGPD y auditoría

3. BASE LEGAL DEL TRATAMIENTO
Cumplimiento de obligación legal (Art. 6.1.c RGPD):
- Art. 34.9 del Estatuto de los Trabajadores (RDL 8/2019)
- Ley 10/2021 sobre teletrabajo
- LISOS (Ley de Infracciones y Sanciones en el Orden Social)

4. PLAZO DE CONSERVACIÓN
Los registros se conservarán un mínimo de 4 años, en cumplimiento de la legislación vigente.

5. DERECHOS DEL INTERESADO
Tienes derecho a:
- Acceder a tus datos personales
- Solicitar la rectificación de datos inexactos
- Solicitar la supresión de datos (limitado por obligaciones legales)
- Oponerle al tratamiento
- Solicitar la limitación del tratamiento
- Derecho de portabilidad
- No ser objeto de decisiones automatizadas

Para ejercer estos derechos, contacta a: info@controlhorario.es

6. SEGURIDAD
Tus datos se protegen mediante:
- Cifrado en tránsito (HTTPS/TLS 1.2+)
- Cifrado en reposo (AES-256)
- Control de accesos basado en roles
- Auditoría de cambios

7. TERCEROS
Los datos solo se comparten con:
- Autoridades públicas (Inspección de Trabajo - ITSS) cuando lo requieran
- Proveedores de infraestructura (bajo acuerdos de confidencialidad)

8. AUTORIDAD DE CONTROL
Agencia Española de Protección de Datos (AEPD)
www.aepd.es

9. ACEPTACIÓN
Al usar esta plataforma, aceptas esta política de privacidad.
`.trim();
    return reply.send({ policy });
};
exports.getPrivacyPolicy = getPrivacyPolicy;
