-- AlterTable
ALTER TABLE "ProjectEstimate" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "ProjectEstimate" ADD CONSTRAINT "ProjectEstimate_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
