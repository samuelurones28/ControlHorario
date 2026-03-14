import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../../middleware/authorize';
import { getCompanySchedules, getMySchedule, updateSchedules } from './schedule.controller';

export const scheduleRoutes: FastifyPluginAsync = async (app) => {
  app.get('/me', {
    preHandler: [authorize(['EMPLOYEE', 'ADMIN'])]
  }, getMySchedule);

  app.get('/company', {
    preHandler: [authorize(['ADMIN'])]
  }, getCompanySchedules);

  app.put('/', {
    preHandler: [authorize(['ADMIN'])]
  }, updateSchedules as any);
};
