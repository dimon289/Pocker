-- CreateEnum
CREATE TYPE "roomstatus" AS ENUM ('Waiting', 'Playing', 'Full');

-- CreateEnum
CREATE TYPE "steptype" AS ENUM ('Check', 'Call', 'Raise', 'Fold', 'Bet', 'End');

-- CreateTable
CREATE TABLE "balance" (
    "id" SERIAL NOT NULL,
    "stepid" INTEGER NOT NULL,
    "userid" INTEGER NOT NULL,
    "balancetype" BOOLEAN NOT NULL DEFAULT false,
    "bet" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "usersid" INTEGER[],
    "messages" JSONB DEFAULT '[]',

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER NOT NULL,
    "cards" CHAR(2)[],
    "roomid" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pocker" (
    "id" SERIAL NOT NULL,
    "roomid" INTEGER NOT NULL,
    "playersid" INTEGER[],
    "cards" CHAR(2)[],
    "bank" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pocker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "usersid" INTEGER[],
    "status" "roomstatus" NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step" (
    "id" SERIAL NOT NULL,
    "pockerid" INTEGER NOT NULL,
    "playerid" INTEGER NOT NULL,
    "bet" INTEGER NOT NULL DEFAULT 0,
    "next_playerid" INTEGER NOT NULL,
    "maxbet" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "steptype" "steptype" NOT NULL,

    CONSTRAINT "step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mybalance" DECIMAL(10,2) DEFAULT 0,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT,
    "description" TEXT,
    "friends" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "chatsid" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "status" BOOLEAN DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "balance_stepid_key" ON "balance"("stepid");

-- CreateIndex
CREATE UNIQUE INDEX "balance_userid_key" ON "balance"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "players_userid_key" ON "players"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "pocker_roomid_key" ON "pocker"("roomid");

-- CreateIndex
CREATE UNIQUE INDEX "step_pockerid_key" ON "step"("pockerid");

-- CreateIndex
CREATE UNIQUE INDEX "step_playerid_key" ON "step"("playerid");

-- CreateIndex
CREATE UNIQUE INDEX "step_next_playerid_key" ON "step"("next_playerid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- AddForeignKey
ALTER TABLE "balance" ADD CONSTRAINT "balance_stepid_fkey" FOREIGN KEY ("stepid") REFERENCES "step"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "balance" ADD CONSTRAINT "balance_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_roomid_fkey" FOREIGN KEY ("roomid") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_userid_fkey" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pocker" ADD CONSTRAINT "pocker_roomid_fkey" FOREIGN KEY ("roomid") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "step" ADD CONSTRAINT "step_next_playerid_fkey" FOREIGN KEY ("next_playerid") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "step" ADD CONSTRAINT "step_playerid_fkey" FOREIGN KEY ("playerid") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "step" ADD CONSTRAINT "step_pockerid_fkey" FOREIGN KEY ("pockerid") REFERENCES "pocker"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
