"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolService = void 0;
const PdfPrinter = require('pdfmake');
const prisma_1 = require("../../utils/prisma");
// Using standard built-in fonts for simplicity, you can configure paths to custom ttf
// pdfmake needs explicit font definitions.
// Note: In a production Linux environment we might need to point to actual TTF paths.
const fonts = {
    Roboto: {
        // using standard fonts from pdfmake:
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};
class ProtocolService {
    async generateInternalProtocol(companyId) {
        const company = await prisma_1.prisma.company.findUnique({ where: { id: companyId } });
        if (!company)
            throw new Error("Company not found");
        const schedules = await prisma_1.prisma.schedule.findMany({
            where: { companyId, employeeId: null },
            orderBy: { dayOfWeek: 'asc' }
        });
        const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const docDefinition = {
            defaultStyle: {
                font: 'Roboto'
            },
            content: [
                { text: 'Protocolo de Registro Horario y Desconexión Digital', style: 'header' },
                { text: `Empresa: ${company.name}`, style: 'subheader' },
                { text: `CIF: ${company.cif}`, style: 'subheader' },
                { text: `Dirección: ${company.address || 'No especificada'}\n\n`, style: 'subheader' },
                { text: '1. Objeto del Protocolo', style: 'sectionHeader' },
                { text: 'Este documento establece las directrices relativas al sistema de registro diario de jornada y las medidas para garantizar el derecho a la desconexión digital de los trabajadores, de conformidad con lo establecido en el artículo 34.9 del Estatuto de los Trabajadores y el artículo 88 de la Ley Orgánica 3/2018 (LOPDGDD), actualizados a las normativas vigentes en 2026.\n\n', style: 'body' },
                { text: '2. Reglas del Sistema de Fichaje y Geolocalización', style: 'sectionHeader' },
                { text: 'La empresa pone a disposición de las personas trabajadoras un sistema de registro horario a través de aplicación web/móvil.\n', style: 'body' },
                {
                    ul: [
                        'El registro debe realizarse estrictamente al inicio y al final de la jornada de trabajo.',
                        'Cualquier pausa que no tenga consideración de tiempo de trabajo efectivo (ej. comida) deberá registrarse mediante los botones de "Iniciar Pausa" y "Reanudar Trabajo".',
                        'En el momento de realizar cada fichaje, el sistema capturará puntualmente la geolocalización del dispositivo para verificar el lugar de prestación de servicios. Este sistema NO constituye un seguimiento continuo (tracking) del trabajador.',
                        'En caso de no disponer de geolocalización o denegar el permiso, el sistema reportará una incidencia automática a recursos humanos para su justificación.'
                    ]
                },
                { text: '\n' },
                { text: '3. Política de Desconexión Digital', style: 'sectionHeader' },
                { text: 'Se reconoce el derecho de todas las personas trabajadoras a la desconexión digital fuera de su tiempo de trabajo legal o convencionalmente establecido.\n', style: 'body' },
                {
                    ul: [
                        'Los trabajadores tienen derecho a no responder a comunicaciones profesionales (correos, mensajes, llamadas) fuera de su jornada laboral.',
                        'El sistema audita y registra de oficio cualquier actividad en la plataforma realizada fuera del horario establecido.',
                        'La empresa no aplicará represalias o medidas disciplinarias por el ejercicio del derecho a la desconexión.'
                    ]
                },
                { text: '\n' },
                { text: '4. Horarios por Defecto Establecidos', style: 'sectionHeader' },
                { text: 'A continuación se detalla el horario general. Los empleados con acuerdos específicos de flexibilidad o jornada reducida se regirán por su horario individual asignado en el sistema.\n\n', style: 'body' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*'],
                        body: [
                            ['Día', 'Hora de Inicio', 'Hora de Fin'],
                            ...schedules.map(s => [
                                DAYS[s.dayOfWeek],
                                s.isWorkDay ? s.startTime : 'Descanso / Libre',
                                s.isWorkDay ? s.endTime : '-'
                            ])
                        ]
                    }
                },
                { text: '\n\n' },
                { text: '5. Aprobación y Firma', style: 'sectionHeader' },
                { text: 'El presente protocolo queda establecido y entra en vigencia a partir de la fecha de su firma, dando cumplimiento a la obligatoriedad legal de documentar el funcionamiento del sistema de registro de jornada.\n\n\n\n\n\n', style: 'body' },
                {
                    columns: [
                        { width: '*', text: 'Firma de la Empresa\n\n\n\n_______________________\nRepresentante Legal' },
                        { width: '*', text: `Fecha de emisión:\n${new Date().toLocaleDateString('es-ES')}` }
                    ]
                }
            ],
            styles: {
                header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                subheader: { fontSize: 12, bold: true, margin: [0, 2, 0, 2] },
                sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], color: '#2563eb' },
                body: { fontSize: 11, margin: [0, 0, 0, 5], alignment: 'justify' }
            }
        };
        const printer = new PdfPrinter(fonts);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        return new Promise((resolve, reject) => {
            let chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err) => reject(err));
            pdfDoc.end();
        });
    }
}
exports.ProtocolService = ProtocolService;
