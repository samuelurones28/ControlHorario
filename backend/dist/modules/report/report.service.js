"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const prisma_1 = require("../../utils/prisma");
const timeCalculation_service_1 = require("../../services/timeCalculation.service");
const date_fns_1 = require("date-fns");
const PdfPrinter = require('pdfmake');
const timeCalcService = new timeCalculation_service_1.TimeCalculationService();
class ReportService {
    async getDailyReport(companyId, dateStr) {
        const targetDate = new Date(dateStr);
        const employees = await prisma_1.prisma.employee.findMany({
            where: { companyId, active: true }
        });
        const report = [];
        for (const emp of employees) {
            const daily = await timeCalcService.calculateDailyRecord(emp.id, targetDate, emp.weeklyHours);
            const lastEntry = await prisma_1.prisma.timeEntry.findFirst({
                where: { employeeId: emp.id, timestamp: { gte: (0, date_fns_1.startOfDay)(targetDate), lte: (0, date_fns_1.endOfDay)(targetDate) } },
                include: { amendments: { orderBy: { createdAt: 'desc' }, take: 1 } }
            });
            let status = 'NO_FICHADO';
            if (daily.isAbsence) {
                status = 'AUSENCIA';
            }
            else if (lastEntry) {
                if (lastEntry.entryType === 'CLOCK_IN' || lastEntry.entryType === 'PAUSE_END')
                    status = 'FICHADO';
                else if (lastEntry.entryType === 'CLOCK_OUT')
                    status = 'SALIO';
                else if (lastEntry.entryType === 'PAUSE_START')
                    status = 'EN_PAUSA';
            }
            report.push({
                employee: { id: emp.id, name: emp.name, identifier: emp.identifier },
                status,
                ...daily
            });
        }
        return report;
    }
    formatTimeToMadrid(date) {
        return date.toLocaleString('es-ES', {
            timeZone: 'Europe/Madrid',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    msToHours(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.round((ms % 3600000) / 60000);
        return `${hours}h ${minutes}m`;
    }
    async exportCsv(companyId, fromStr, toStr) {
        const from = new Date(fromStr);
        const to = new Date(toStr);
        const company = await prisma_1.prisma.company.findUnique({
            where: { id: companyId }
        });
        if (!company)
            throw new Error('Company not found');
        const employees = await prisma_1.prisma.employee.findMany({
            where: { companyId }
        });
        // CSV Headers: Empleado, Fecha, Entrada, Salida, Total Horas, Horas Extra, Tipo Horas
        let csv = 'Empleado,Fecha,Entrada,Salida,Total Horas,Horas Extra,Tipo Horas\n';
        for (const emp of employees) {
            for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                const daily = await timeCalcService.calculateDailyRecord(emp.id, d, emp.weeklyHours);
                if (daily.netWorked > 0 || daily.isAbsence) {
                    const formattedDate = d.toISOString().split('T')[0];
                    let typeHours = daily.overtime > 0 ? 'Con Extra' : 'Normal';
                    let entrada = '';
                    let salida = '';
                    if (daily.isAbsence) {
                        typeHours = daily.absenceType || 'JUSTIFICADO';
                        entrada = '-';
                        salida = '-';
                    }
                    else {
                        const entries = await prisma_1.prisma.timeEntry.findMany({
                            where: { employeeId: emp.id, timestamp: { gte: (0, date_fns_1.startOfDay)(d), lte: (0, date_fns_1.endOfDay)(d) } },
                            orderBy: { timestamp: 'asc' }
                        });
                        const clockIn = entries.find(e => e.entryType === 'CLOCK_IN')?.timestamp;
                        const clockOut = entries.reverse().find(e => e.entryType === 'CLOCK_OUT')?.timestamp;
                        entrada = clockIn ? this.formatTimeToMadrid(clockIn).split(' ')[1] : '';
                        salida = clockOut ? this.formatTimeToMadrid(clockOut).split(' ')[1] : '';
                    }
                    const totalHours = this.msToHours(daily.netWorked);
                    const extraHours = daily.overtime > 0 ? this.msToHours(daily.overtime) : '0h 0m';
                    csv += `"${emp.name}",${formattedDate},${entrada},${salida},${totalHours},${extraHours},"${typeHours}"\n`;
                }
            }
        }
        return csv;
    }
    async exportPdf(companyId, fromStr, toStr) {
        const from = new Date(fromStr);
        const to = new Date(toStr);
        const company = await prisma_1.prisma.company.findUnique({
            where: { id: companyId }
        });
        if (!company)
            throw new Error('Company not found');
        const employees = await prisma_1.prisma.employee.findMany({
            where: { companyId }
        });
        // Build table data
        const tableBody = [
            ['Empleado', 'Fecha', 'Entrada', 'Salida', 'Total Horas', 'Horas Extra', 'Tipo']
        ];
        for (const emp of employees) {
            for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                const daily = await timeCalcService.calculateDailyRecord(emp.id, d, emp.weeklyHours);
                if (daily.netWorked > 0 || daily.isAbsence) {
                    const formattedDate = d.toISOString().split('T')[0];
                    let typeHours = daily.overtime > 0 ? 'Con Extra' : 'Normal';
                    let entrada = '';
                    let salida = '';
                    if (daily.isAbsence) {
                        typeHours = daily.absenceType || 'JUSTIFICADO';
                        entrada = '-';
                        salida = '-';
                    }
                    else {
                        const entries = await prisma_1.prisma.timeEntry.findMany({
                            where: { employeeId: emp.id, timestamp: { gte: (0, date_fns_1.startOfDay)(d), lte: (0, date_fns_1.endOfDay)(d) } },
                            orderBy: { timestamp: 'asc' }
                        });
                        const clockIn = entries.find(e => e.entryType === 'CLOCK_IN')?.timestamp;
                        const clockOut = entries.reverse().find(e => e.entryType === 'CLOCK_OUT')?.timestamp;
                        entrada = clockIn ? this.formatTimeToMadrid(clockIn).split(' ')[1] : '';
                        salida = clockOut ? this.formatTimeToMadrid(clockOut).split(' ')[1] : '';
                    }
                    const totalHours = this.msToHours(daily.netWorked);
                    const extraHours = daily.overtime > 0 ? this.msToHours(daily.overtime) : '0h 0m';
                    tableBody.push([
                        emp.name,
                        formattedDate,
                        entrada,
                        salida,
                        totalHours,
                        extraHours,
                        typeHours
                    ]);
                }
            }
        }
        const fonts = {
            Roboto: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };
        const docDefinition = {
            defaultStyle: {
                font: 'Roboto'
            },
            content: [
                { text: 'Informe de Registros Horarios', style: 'header' },
                { text: `Empresa: ${company.name}`, style: 'subheader' },
                { text: `CIF: ${company.cif}`, style: 'subheader' },
                { text: `Período: ${from.toISOString().split('T')[0]} a ${to.toISOString().split('T')[0]}\n\n`, style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*', '*', '*', '*', '*'],
                        body: tableBody
                    }
                },
                { text: '\nConforme a lo dispuesto en el Art. 34.9 del Estatuto de los Trabajadores (RDL 8/2019)', style: 'footer' },
                { text: `Generado: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, style: 'footer' }
            ],
            styles: {
                header: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                subheader: { fontSize: 11, bold: true, margin: [0, 2, 0, 2] },
                footer: { fontSize: 9, alignment: 'center', margin: [0, 10, 0, 0], color: '#666' }
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
exports.ReportService = ReportService;
