/*
  Warnings:

  - You are about to drop the column `paidDays` on the `PayrollRecord` table. All the data in the column will be lost.
  - You are about to drop the column `salaryBasic` on the `PayrollRecord` table. All the data in the column will be lost.
  - You are about to drop the column `totalEarnings` on the `PayrollRecord` table. All the data in the column will be lost.
  - You are about to drop the column `workingDays` on the `PayrollRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PayrollRecord" DROP CONSTRAINT "PayrollRecord_userId_fkey";

-- AlterTable
ALTER TABLE "PayrollRecord" DROP COLUMN "paidDays",
DROP COLUMN "salaryBasic",
DROP COLUMN "totalEarnings",
DROP COLUMN "workingDays",
ADD COLUMN     "basic" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "daysWorked" DOUBLE PRECISION NOT NULL DEFAULT 26,
ADD COLUMN     "grossEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;
