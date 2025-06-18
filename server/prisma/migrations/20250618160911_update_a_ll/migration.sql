-- DropForeignKey
ALTER TABLE "step" DROP CONSTRAINT "step_playerid_fkey";

-- DropForeignKey
ALTER TABLE "step" DROP CONSTRAINT "step_pockerid_fkey";

-- DropIndex
DROP INDEX "step_playerid_key";

-- DropIndex
DROP INDEX "step_pockerid_key";

-- AlterTable
ALTER TABLE "pocker" ADD COLUMN     "stepsid" INTEGER[];
