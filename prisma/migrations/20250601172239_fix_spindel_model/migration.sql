/*
  Warnings:

  - You are about to drop the column `oxygenLevel` on the `SpindelReading` table. All the data in the column will be lost.
  - You are about to drop the column `pH` on the `SpindelReading` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SpindelReading` table. All the data in the column will be lost.
  - Added the required column `angleTilt` to the `SpindelReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `battery` to the `SpindelReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entryId` to the `SpindelReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gravity` to the `SpindelReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interval` to the `SpindelReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rssi` to the `SpindelReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `SpindelReading` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpindelReading" DROP COLUMN "oxygenLevel",
DROP COLUMN "pH",
DROP COLUMN "updatedAt",
ADD COLUMN     "angleTilt" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "battery" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "entryId" INTEGER NOT NULL,
ADD COLUMN     "gravity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "interval" INTEGER NOT NULL,
ADD COLUMN     "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rssi" INTEGER NOT NULL,
ADD COLUMN     "ssid" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL,
ALTER COLUMN "createdAt" DROP DEFAULT;
