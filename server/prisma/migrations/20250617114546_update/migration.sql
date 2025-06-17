-- DropForeignKey
ALTER TABLE "players" DROP CONSTRAINT "players_userid_fkey";

-- DropIndex
DROP INDEX "players_userid_key";
