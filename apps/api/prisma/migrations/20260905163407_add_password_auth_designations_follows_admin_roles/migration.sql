-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."DesignationCategory" AS ENUM ('CREATOR', 'CONSUMER');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "bio" VARCHAR(280),
ADD COLUMN     "designationId" TEXT,
ADD COLUMN     "followerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "followingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passwordHash" VARCHAR(255),
ADD COLUMN     "postCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "totalLikesReceived" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."Designation" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "category" "public"."DesignationCategory" NOT NULL,
    "topic" VARCHAR(64),
    "group" VARCHAR(64) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Follow" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Designation_slug_key" ON "public"."Designation"("slug");

-- CreateIndex
CREATE INDEX "Designation_category_idx" ON "public"."Designation"("category");

-- CreateIndex
CREATE INDEX "Designation_group_idx" ON "public"."Designation"("group");

-- CreateIndex
CREATE INDEX "Designation_active_idx" ON "public"."Designation"("active");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "public"."Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "public"."Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "public"."Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "User_designationId_idx" ON "public"."User"("designationId");

-- CreateIndex
CREATE INDEX "User_followerCount_idx" ON "public"."User"("followerCount");

-- CreateIndex
CREATE INDEX "User_totalLikesReceived_idx" ON "public"."User"("totalLikesReceived");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "public"."User"("isActive");

-- CreateIndex
CREATE INDEX "Post_likesCount_idx" ON "public"."Post"("likesCount");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "public"."Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

