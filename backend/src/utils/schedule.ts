import { prisma } from './prisma';

export const isOutsideSchedule = async (employeeId: string, companyId: string, date: Date = new Date()): Promise<boolean> => {
  const dayOfWeek = date.getUTCDay(); // 0-6 (Sunday-Saturday)
  
  // Try to find employee specific schedule for today
  let schedule = await prisma.schedule.findUnique({
    where: { employeeId_dayOfWeek: { employeeId, dayOfWeek } }
  });

  // Fallback to company schedule
  if (!schedule) {
    const companySchedules = await prisma.schedule.findMany({
      where: { companyId, dayOfWeek, employeeId: null }
    });
    if (companySchedules.length > 0) {
      schedule = companySchedules[0];
    }
  }

  // If no schedule defined at all, assume no restriction
  if (!schedule) return false;

  // If it's explicitly not a work day
  if (!schedule.isWorkDay) return true;

  // Parse current time in HH:mm. Note: Timezones might require offset handling in production,
  // but for MVP we compare local Spain time usually.
  // Using an approach that formats the date to the company timezone would be ideal.
  // For now, we'll do a simple UTC to local heuristic or just use the HH:MM from the Date object in the server's timezone.
  
  // Format current server time to HH:mm
  const currentHours = date.getHours().toString().padStart(2, '0');
  const currentMinutes = date.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  return currentTimeStr < schedule.startTime || currentTimeStr > schedule.endTime;
};

export const logDisconnectionViolation = async (employeeId: string, action: string, details: any) => {
  await prisma.auditLog.create({
    data: {
      employeeId,
      action: 'DIGITAL_DISCONNECT_VIOLATION',
      entity: 'Employee',
      entityId: employeeId,
      details
    }
  });
};
