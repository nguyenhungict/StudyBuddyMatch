/*
  Warnings:

  - You are about to drop the column `request_id` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `request_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `connection_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_goal_stats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_style_stats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "connection_requests" DROP CONSTRAINT "connection_requests_from_user_id_fkey";

-- DropForeignKey
ALTER TABLE "connection_requests" DROP CONSTRAINT "connection_requests_to_user_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_request_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_request_id_fkey";

-- DropForeignKey
ALTER TABLE "user_goal_stats" DROP CONSTRAINT "user_goal_stats_tag_learninggoal_id_fkey";

-- DropForeignKey
ALTER TABLE "user_goal_stats" DROP CONSTRAINT "user_goal_stats_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_style_stats" DROP CONSTRAINT "user_style_stats_tag_studystyle_id_fkey";

-- DropForeignKey
ALTER TABLE "user_style_stats" DROP CONSTRAINT "user_style_stats_user_id_fkey";

-- AlterTable
ALTER TABLE "matches" DROP COLUMN "request_id";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "request_id";

-- DropTable
DROP TABLE "connection_requests";

-- DropTable
DROP TABLE "user_goal_stats";

-- DropTable
DROP TABLE "user_style_stats";

-- DropEnum
DROP TYPE "ConnectionStatus";
