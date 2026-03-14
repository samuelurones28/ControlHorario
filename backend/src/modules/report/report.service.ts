import { prisma } from '../../utils/prisma';
import { TimeCalculationService } from '../../services/timeCalculation.service';
import { startOfDay, endOfDay } from 'date-fns';
const PdfPrinter = require('pdfmake');

const timeCalcService = new TimeCalculationService();

export class ReportService {
  async getDailyReport(companyId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    
    const employees = await prisma.employee.findMany({
      where: { companyId, active: true }
    });

    const report = [];
    for (const emp of employees) {
      const daily = await timeCalcService.calculateDailyRecord(emp.id, targetDate, emp.weeklyHours);
      
      const lastEntry = await prisma.timeEntry.findFirst({
        where: { employeeId: emp.id, timestamp: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) } },
        include: { amendments: { orderBy: { createdAt: 'desc' }, take: 1 } }
      });

      let status = 'NO_FICHADO';
      if (daily.isAbsence) {
        status = 'AUSENCIA';
      } else if (lastEntry) {
        if (lastEntry.entryType === 'CLOCK_IN' || lastEntry.entryType === 'PAUSE_END') status = 'FICHADO';
        else if (lastEntry.entryType === 'CLOCK_OUT') status = 'SALIO';
        else if (lastEntry.entryType === 'PAUSE_START') status = 'EN_PAUSA';
      }

      report.push({
        employee: { id: emp.id, name: emp.name, identifier: emp.identifier },
        status,
        ...daily
      });
    }

    return report;
  }

  private formatTimeToMadrid(date: Date): string {
    return date.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private msToHours(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.round((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  async exportCsv(companyId: string, fromStr: string, toStr: string) {
    const from = new Date(fromStr);
    const to = new Date(toStr);

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) throw new Error('Company not found');

    const employees = await prisma.employee.findMany({
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
          } else {
             const entries = await prisma.timeEntry.findMany({
                 where: { employeeId: emp.id, timestamp: { gte: startOfDay(d), lte: endOfDay(d)} },
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

  async exportPdf(companyId: string, fromStr: string, toStr: string): Promise<Buffer> {
    const from = new Date(fromStr);
    const to = new Date(toStr);

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) throw new Error('Company not found');

    const employees = await prisma.employee.findMany({
      where: { companyId }
    });

    // Build table data
    const tableBody: any[] = [
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
          } else {
             const entries = await prisma.timeEntry.findMany({
                 where: { employeeId: emp.id, timestamp: { gte: startOfDay(d), lte: endOfDay(d)} },
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

    const docDefinition: any = {
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
      let chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err: any) => reject(err));
      pdfDoc.end();
    });
  }
}
