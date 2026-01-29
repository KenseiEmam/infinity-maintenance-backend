/*
  Warnings:

  - A unique constraint covering the columns `[callId]` on the table `JobSheet` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_jobSheetId_fkey";

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_machineId_fkey";

-- DropForeignKey
ALTER TABLE "JobSheet" DROP CONSTRAINT "JobSheet_customerId_fkey";

-- DropForeignKey
ALTER TABLE "JobSheet" DROP CONSTRAINT "JobSheet_engineerId_fkey";

-- DropForeignKey
ALTER TABLE "JobSheet" DROP CONSTRAINT "JobSheet_machineId_fkey";

-- DropForeignKey
ALTER TABLE "LaserData" DROP CONSTRAINT "LaserData_jobSheetId_fkey";

-- DropForeignKey
ALTER TABLE "Machine" DROP CONSTRAINT "Machine_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Machine" DROP CONSTRAINT "Machine_modelId_fkey";

-- DropForeignKey
ALTER TABLE "Model" DROP CONSTRAINT "Model_manufacturerId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledVisit" DROP CONSTRAINT "ScheduledVisit_machineId_fkey";

-- DropForeignKey
ALTER TABLE "SparePart" DROP CONSTRAINT "SparePart_jobSheetId_fkey";

-- AlterTable
ALTER TABLE "JobSheet" ADD COLUMN     "callId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JobSheet_callId_key" ON "JobSheet"("callId");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSheet" ADD CONSTRAINT "JobSheet_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSheet" ADD CONSTRAINT "JobSheet_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSheet" ADD CONSTRAINT "JobSheet_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSheet" ADD CONSTRAINT "JobSheet_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaserData" ADD CONSTRAINT "LaserData_jobSheetId_fkey" FOREIGN KEY ("jobSheetId") REFERENCES "JobSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_jobSheetId_fkey" FOREIGN KEY ("jobSheetId") REFERENCES "JobSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_jobSheetId_fkey" FOREIGN KEY ("jobSheetId") REFERENCES "JobSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledVisit" ADD CONSTRAINT "ScheduledVisit_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
