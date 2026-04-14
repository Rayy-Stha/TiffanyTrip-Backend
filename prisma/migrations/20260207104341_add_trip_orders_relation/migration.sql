-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "tripId" INTEGER;

-- CreateIndex
CREATE INDEX "Order_tripId_idx" ON "Order"("tripId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
