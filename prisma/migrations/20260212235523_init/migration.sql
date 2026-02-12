-- CreateEnum
CREATE TYPE "status_trail_status" AS ENUM ('gate-out', 'gate-in', 'reg-in', 'reg-out');

-- CreateEnum
CREATE TYPE "status_trail_source" AS ENUM ('gate', 'registration', 'admin', 'system');

-- CreateEnum
CREATE TYPE "user_currentStatus" AS ENUM ('gate-out', 'gate-in', 'reg-in', 'reg-out');

-- CreateTable
CREATE TABLE "status_trail" (
    "trailId" SERIAL NOT NULL,
    "userId" VARCHAR(6) NOT NULL,
    "status" "status_trail_status" NOT NULL,
    "timestamp" TIMESTAMP(0) NOT NULL,
    "source" "status_trail_source" NOT NULL,

    CONSTRAINT "status_trail_pkey" PRIMARY KEY ("trailId")
);

-- CreateTable
CREATE TABLE "user" (
    "id" VARCHAR(6) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "collegeName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "visitDates" TEXT NOT NULL,
    "currentStatus" "user_currentStatus" NOT NULL DEFAULT 'gate-out',
    "lastStatusTime" TIMESTAMP(0) NOT NULL,
    "festId" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_event" (
    "userId" VARCHAR(6) NOT NULL,
    "eventId" INTEGER NOT NULL,
    "eventName" VARCHAR(255) NOT NULL,
    "festId" TEXT NOT NULL,

    CONSTRAINT "user_event_pkey" PRIMARY KEY ("userId","eventId")
);

-- CreateTable
CREATE TABLE "fest_user" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'fest',
    "createdAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "fest_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "userId" ON "status_trail"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email" ON "user"("email");

-- CreateIndex
CREATE INDEX "festId" ON "user"("festId");

-- CreateIndex
CREATE INDEX "festId_event" ON "user_event"("festId");

-- CreateIndex
CREATE UNIQUE INDEX "fest_user_username_key" ON "fest_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "fest_user_email_key" ON "fest_user"("email");

-- AddForeignKey
ALTER TABLE "status_trail" ADD CONSTRAINT "status_trail_ibfk_1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_festId_fkey" FOREIGN KEY ("festId") REFERENCES "fest_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_event" ADD CONSTRAINT "user_event_ibfk_1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_event" ADD CONSTRAINT "user_event_festId_fkey" FOREIGN KEY ("festId") REFERENCES "fest_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
