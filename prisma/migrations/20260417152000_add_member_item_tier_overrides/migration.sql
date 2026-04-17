-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "itemTierOverrides" JSONB NOT NULL DEFAULT '[]';
