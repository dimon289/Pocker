/*
  Warnings:

  - The values [PreFlop,Flop,Turn,River,Showdown] on the enum `steptype` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `next_playerid` on the `step` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "steptype_new" AS ENUM ('Fold', 'Check', 'Call', 'Raise', 'ReRaise', 'Allin');
ALTER TABLE "step" ALTER COLUMN "steptype" TYPE "steptype_new" USING ("steptype"::text::"steptype_new");
ALTER TYPE "steptype" RENAME TO "steptype_old";
ALTER TYPE "steptype_new" RENAME TO "steptype";
DROP TYPE "steptype_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "step" DROP CONSTRAINT "step_next_playerid_fkey";

-- DropIndex
DROP INDEX "step_next_playerid_key";

-- AlterTable
ALTER TABLE "step" DROP COLUMN "next_playerid",
ALTER COLUMN "bet" SET DEFAULT 0,
ALTER COLUMN "bet" SET DATA TYPE DECIMAL(65,30);
