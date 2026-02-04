/*
  Warnings:

  - The values [MUTE] on the enum `ModerationAction` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[word_text,word_type]` on the table `violation_keywords` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ModerationAction_new" AS ENUM ('WARN', 'BAN', 'DELETE_CONTENT', 'NONE');
ALTER TABLE "public"."moderations" ALTER COLUMN "action" DROP DEFAULT;
ALTER TABLE "moderations" ALTER COLUMN "action" TYPE "ModerationAction_new" USING ("action"::text::"ModerationAction_new");
ALTER TABLE "moderation_logs" ALTER COLUMN "action" TYPE "ModerationAction_new" USING ("action"::text::"ModerationAction_new");
ALTER TYPE "ModerationAction" RENAME TO "ModerationAction_old";
ALTER TYPE "ModerationAction_new" RENAME TO "ModerationAction";
DROP TYPE "public"."ModerationAction_old";
ALTER TABLE "moderations" ALTER COLUMN "action" SET DEFAULT 'NONE';
COMMIT;

-- DropIndex
DROP INDEX "violation_keywords_word_text_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ban_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "banned_until" TIMESTAMP(6),
ADD COLUMN     "last_violation_at" TIMESTAMP(6),
ADD COLUMN     "warn_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "violation_keywords" ADD COLUMN     "word_type" VARCHAR(50) NOT NULL DEFAULT 'SPAM';

-- CreateIndex
CREATE UNIQUE INDEX "violation_keywords_word_text_word_type_key" ON "violation_keywords"("word_text", "word_type");
