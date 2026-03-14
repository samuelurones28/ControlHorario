/*
  Warnings:

  - You are about to drop the column `approvedById` on the `TimeEntryAmendment` table. All the data in the column will be lost.
  - You are about to drop the column `requestedById` on the `TimeEntryAmendment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `TimeEntryAmendment` table. All the data in the column will be lost.
  - Added the required column `action` to the `TimeEntryAmendment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `TimeEntryAmendment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `TimeEntryAmendment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `TimeEntryAmendment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entryType` to the `TimeEntryAmendment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AmendmentAction" AS ENUM ('ADD', 'MODIFY');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'DISPUTED');

-- DropForeignKey
ALTER TABLE "TimeEntryAmendment" DROP CONSTRAINT "TimeEntryAmendment_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "TimeEntryAmendment" DROP CONSTRAINT "TimeEntryAmendment_originalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "TimeEntryAmendment" DROP CONSTRAINT "TimeEntryAmendment_requestedById_fkey";

-- AlterTable
ALTER TABLE "TimeEntryAmendment" DROP COLUMN "approvedById",
DROP COLUMN "requestedById",
DROP COLUMN "status",
ADD COLUMN     "action" "AmendmentAction" NOT NULL,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "employeeId" TEXT NOT NULL,
ADD COLUMN     "entryType" "EntryType" NOT NULL,
ADD COLUMN     "incidentId" TEXT,
ADD COLUMN     "originalTimestamp" TIMESTAMP(3),
ALTER COLUMN "originalEntryId" DROP NOT NULL;

-- DropEnum
DROP TYPE "AmendmentStatus";

-- CreateTable
CREATE TABLE "PrivacyConsent" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,

    CONSTRAINT "PrivacyConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isWorkDay" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "timeEntryId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "totalWorked" DOUBLE PRECISION NOT NULL,
    "totalPaused" DOUBLE PRECISION NOT NULL,
    "overtime" DOUBLE PRECISION NOT NULL,
    "data" JSONB NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "disputeReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_employeeId_dayOfWeek_key" ON "Schedule"("employeeId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "company_day_unique" ON "Schedule"("companyId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "PrivacyConsent" ADD CONSTRAINT "PrivacyConsent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "TimeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryAmendment" ADD CONSTRAINT "TimeEntryAmendment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryAmendment" ADD CONSTRAINT "TimeEntryAmendment_originalEntryId_fkey" FOREIGN KEY ("originalEntryId") REFERENCES "TimeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntryAmendment" ADD CONSTRAINT "TimeEntryAmendment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
