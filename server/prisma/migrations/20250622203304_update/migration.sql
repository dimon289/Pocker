/*
  Warnings:

  - You are about to drop the column `balancetype` on the `balance` table. All the data in the column will be lost.
  - You are about to drop the column `bet` on the `balance` table. All the data in the column will be lost.
  - You are about to drop the column `stepid` on the `balance` table. All the data in the column will be lost.
  - Added the required column `balanceChange` to the `balance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceType` to the `balance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "balanceType" AS ENUM ('Dep', 'Withdraw', 'Game');

-- DropForeignKey
ALTER TABLE "balance" DROP CONSTRAINT "balance_stepid_fkey";

-- DropForeignKey
ALTER TABLE "balance" DROP CONSTRAINT "balance_userid_fkey";

-- DropIndex
DROP INDEX "balance_stepid_key";

-- DropIndex
DROP INDEX "balance_userid_key";

-- AlterTable
ALTER TABLE "balance" DROP COLUMN "balancetype",
DROP COLUMN "bet",
DROP COLUMN "stepid",
ADD COLUMN     "balanceChange" INTEGER NOT NULL,
ADD COLUMN     "balanceType" "balanceType" NOT NULL;
