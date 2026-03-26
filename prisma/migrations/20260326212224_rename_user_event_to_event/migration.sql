/*
  Warnings:

  - You are about to drop the `user_event` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_event" DROP CONSTRAINT "user_event_festId_fkey";

-- DropForeignKey
ALTER TABLE "user_event" DROP CONSTRAINT "user_event_ibfk_1";

-- DropTable
DROP TABLE "user_event";

-- CreateTable
CREATE TABLE "event" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "festId" TEXT NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_eventTouser" (
    "A" INTEGER NOT NULL,
    "B" VARCHAR(6) NOT NULL,

    CONSTRAINT "_eventTouser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "festId_event" ON "event"("festId");

-- CreateIndex
CREATE UNIQUE INDEX "event_name_festId_key" ON "event"("name", "festId");

-- CreateIndex
CREATE INDEX "_eventTouser_B_index" ON "_eventTouser"("B");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_festId_fkey" FOREIGN KEY ("festId") REFERENCES "fest_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_eventTouser" ADD CONSTRAINT "_eventTouser_A_fkey" FOREIGN KEY ("A") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_eventTouser" ADD CONSTRAINT "_eventTouser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
