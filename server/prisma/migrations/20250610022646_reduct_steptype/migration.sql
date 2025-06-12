/*
  Warnings:

  - The values [Check,Call,Raise,Fold,Bet,End] on the enum `steptype` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "steptype_new" AS ENUM ('PreFlop', 'Flop', 'Turn', 'River', 'Showdown');
ALTER TABLE "step" ALTER COLUMN "steptype" TYPE "steptype_new" USING ("steptype"::text::"steptype_new");
ALTER TYPE "steptype" RENAME TO "steptype_old";
ALTER TYPE "steptype_new" RENAME TO "steptype";
DROP TYPE "steptype_old";
COMMIT;
