-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('INSTALLATION', 'CONTRACT', 'PAID');

-- AlterTable
ALTER TABLE "JobSheet" ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'CONTRACT';

-- AlterTable
ALTER TABLE "SparePart" ADD COLUMN     "discounted" DOUBLE PRECISION;
