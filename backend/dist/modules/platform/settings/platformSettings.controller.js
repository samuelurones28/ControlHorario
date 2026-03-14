"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSettingsController = void 0;
const prisma_1 = require("../../../utils/prisma");
class PlatformSettingsController {
    static async getSettings(request, reply) {
        const settings = await prisma_1.prisma.platformSetting.findMany({
            orderBy: { key: 'asc' }
        });
        // Convert from Array of objects to a Key-Value dictionary for easier frontend consumption
        const settingsMap = settings.reduce((acc, current) => {
            acc[current.key] = current.value;
            return acc;
        }, {});
        return reply.send(settingsMap);
    }
    static async updateSetting(request, reply) {
        const { key } = request.params;
        const { value } = request.body;
        const adminId = request.platformAdmin?.id;
        const setting = await prisma_1.prisma.platformSetting.upsert({
            where: { key },
            update: { value, updatedBy: adminId },
            create: { key, value, updatedBy: adminId }
        });
        return reply.send(setting);
    }
}
exports.PlatformSettingsController = PlatformSettingsController;
