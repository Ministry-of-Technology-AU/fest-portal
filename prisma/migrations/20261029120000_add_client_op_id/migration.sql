-- AlterTable
ALTER TABLE "status_trail" ADD COLUMN     "clientOpId" VARCHAR(36);

-- CreateIndex
CREATE UNIQUE INDEX "status_trail_clientOpId_key" ON "status_trail"("clientOpId");
