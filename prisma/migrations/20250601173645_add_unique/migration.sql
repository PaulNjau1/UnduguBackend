/*
  Warnings:

  - A unique constraint covering the columns `[entryId]` on the table `SpindelReading` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SpindelReading_entryId_key" ON "SpindelReading"("entryId");
