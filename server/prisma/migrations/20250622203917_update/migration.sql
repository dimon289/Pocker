/*
  Warnings:

  - The values [Game] on the enum `balanceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "balanceType_new" AS ENUM ('Dep', 'Withdraw', 'GameLoose', 'GameWin');
ALTER TABLE "balance" ALTER COLUMN "balanceType" TYPE "balanceType_new" USING ("balanceType"::text::"balanceType_new");
ALTER TYPE "balanceType" RENAME TO "balanceType_old";
ALTER TYPE "balanceType_new" RENAME TO "balanceType";
DROP TYPE "balanceType_old";
COMMIT;
