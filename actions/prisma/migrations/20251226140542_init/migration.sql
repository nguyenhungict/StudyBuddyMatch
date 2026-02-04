-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('ACTIVE', 'UNMATCHED');

-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('WARN', 'BAN', 'MUTE', 'DELETE_CONTENT', 'NONE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'IMAGE', 'FILE');

-- CreateTable
CREATE TABLE "roles" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role_id" UUID NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "name" "RoleName" NOT NULL DEFAULT 'USER',

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "users" (
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role_id" UUID NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "user_id" UUID NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockUntil" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "verify_codes" (
    "verify_code_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "used_at" TIMESTAMP(6),
    "expired_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verify_codes_pkey" PRIMARY KEY ("verify_code_id")
);

-- CreateTable
CREATE TABLE "tag_subjects" (
    "tag_subject_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "tag_subjects_pkey" PRIMARY KEY ("tag_subject_id")
);

-- CreateTable
CREATE TABLE "tag_levels" (
    "tag_level_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "tag_levels_pkey" PRIMARY KEY ("tag_level_id")
);

-- CreateTable
CREATE TABLE "tag_study_styles" (
    "tag_studystyle_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "tag_study_styles_pkey" PRIMARY KEY ("tag_studystyle_id")
);

-- CreateTable
CREATE TABLE "tag_learning_goals" (
    "tag_learninggoal_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "tag_learning_goals_pkey" PRIMARY KEY ("tag_learninggoal_id")
);

-- CreateTable
CREATE TABLE "tag_genders" (
    "tag_gender_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "tag_genders_pkey" PRIMARY KEY ("tag_gender_id")
);

-- CreateTable
CREATE TABLE "tag_study_days" (
    "tag_studyday_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "tag_study_days_pkey" PRIMARY KEY ("tag_studyday_id")
);

-- CreateTable
CREATE TABLE "tag_study_times" (
    "tag_studytime_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "tag_study_times_pkey" PRIMARY KEY ("tag_studytime_id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "username_code" VARCHAR(50) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "profile_picture_url" VARCHAR(255),
    "birthday" DATE,
    "bio" TEXT,
    "school" VARCHAR(255),
    "achievement" TEXT,
    "tag_level_id" UUID NOT NULL,
    "tag_subject_id" UUID NOT NULL,
    "tag_learninggoal_id" UUID,
    "tag_studyday_id" UUID,
    "tag_studytime_id" UUID,
    "tag_gender_id" UUID,
    "tag_studystyle_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_id" UUID NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "user_id" UUID NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'PREFER_NOT_TO_SAY',
    "avatarUrl" TEXT,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "swipes" (
    "swipe_id" UUID NOT NULL,
    "swiper_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "is_like" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "swipes_pkey" PRIMARY KEY ("swipe_id")
);

-- CreateTable
CREATE TABLE "matches" (
    "match_id" UUID NOT NULL,
    "request_id" UUID,
    "user1_id" UUID NOT NULL,
    "user2_id" UUID NOT NULL,
    "swipe1_id" UUID,
    "swipe2_id" UUID,
    "end_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matched_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "matches_pkey" PRIMARY KEY ("match_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "match_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    "end_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversation_id" UUID NOT NULL,
    "last_message_at" TIMESTAMP(6),
    "last_message_id" UUID,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "sender_id" UUID NOT NULL,
    "call_id" UUID,
    "text" TEXT,
    "file_name" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(6),
    "read_at" TIMESTAMP(6),
    "conversation_id" UUID NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "message_id" UUID NOT NULL,
    "reply_to_id" UUID,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "type" "ContentType" NOT NULL DEFAULT 'TEXT',

    CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "file_url" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255),
    "file_mime" VARCHAR(100),
    "file_size" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachment_id" UUID NOT NULL,
    "message_id" UUID,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "calls" (
    "call_id" UUID NOT NULL,
    "caller_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'CONNECTING',
    "accepted_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversation_id" UUID NOT NULL,
    "ended_at" TIMESTAMP(6),
    "ended_by_id" UUID,
    "recipient_id" UUID NOT NULL,
    "call_type" "CallType" NOT NULL DEFAULT 'AUDIO',
    "duration" INTEGER,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("call_id")
);

-- CreateTable
CREATE TABLE "connection_requests" (
    "request_id" UUID NOT NULL,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "message" TEXT,
    "accepted_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "connection_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "violation_keywords" (
    "word_id" UUID NOT NULL,
    "word_text" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violation_keywords_pkey" PRIMARY KEY ("word_id")
);

-- CreateTable
CREATE TABLE "moderations" (
    "moderation_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "target_id" UUID NOT NULL,
    "reporter_id" UUID,
    "reviewer_id" UUID,
    "message_id" UUID,
    "word_id" UUID,
    "reason" TEXT,
    "action" "ModerationAction" NOT NULL DEFAULT 'NONE',
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "violation_count" INTEGER NOT NULL DEFAULT 1,
    "reviewed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "moderations_pkey" PRIMARY KEY ("moderation_id")
);

-- CreateTable
CREATE TABLE "moderation_logs" (
    "log_id" UUID NOT NULL,
    "moderation_id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "noti_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "match_id" UUID,
    "request_id" UUID,
    "moderation_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("noti_id")
);

-- CreateTable
CREATE TABLE "user_study_slots" (
    "slot_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tag_studyday_id" UUID NOT NULL,
    "tag_studytime_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_study_slots_pkey" PRIMARY KEY ("slot_id")
);

-- CreateTable
CREATE TABLE "user_style_stats" (
    "tag_studystyle_id" UUID NOT NULL,
    "seen_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "like_rate" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "stat_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "user_style_stats_pkey" PRIMARY KEY ("stat_id")
);

-- CreateTable
CREATE TABLE "user_goal_stats" (
    "tag_learninggoal_id" UUID NOT NULL,
    "seen_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "like_rate" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "stat_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "user_goal_stats_pkey" PRIMARY KEY ("stat_id")
);

-- CreateTable
CREATE TABLE "resources" (
    "resource_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "subject" VARCHAR(100),
    "grade" VARCHAR(50),
    "file_name" VARCHAR(255),
    "file_url" VARCHAR(500),
    "file_type" VARCHAR(50),
    "file_size" VARCHAR(50),
    "status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("resource_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tag_subjects_code_key" ON "tag_subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tag_levels_code_key" ON "tag_levels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tag_study_styles_code_key" ON "tag_study_styles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tag_learning_goals_code_key" ON "tag_learning_goals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tag_genders_code_key" ON "tag_genders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tag_study_days_code_key" ON "tag_study_days"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tag_study_times_code_key" ON "tag_study_times"("code");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_code_key" ON "profiles"("username_code");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "swipes_swiper_id_target_id_key" ON "swipes"("swiper_id", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user1_id_user2_id_key" ON "matches"("user1_id", "user2_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_last_message_id_key" ON "conversations"("last_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "violation_keywords_word_text_key" ON "violation_keywords"("word_text");

-- CreateIndex
CREATE UNIQUE INDEX "user_study_slots_user_id_tag_studyday_id_tag_studytime_id_key" ON "user_study_slots"("user_id", "tag_studyday_id", "tag_studytime_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_style_stats_user_id_tag_studystyle_id_key" ON "user_style_stats"("user_id", "tag_studystyle_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_goal_stats_user_id_tag_learninggoal_id_key" ON "user_goal_stats"("user_id", "tag_learninggoal_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verify_codes" ADD CONSTRAINT "verify_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tag_gender_id_fkey" FOREIGN KEY ("tag_gender_id") REFERENCES "tag_genders"("tag_gender_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tag_learninggoal_id_fkey" FOREIGN KEY ("tag_learninggoal_id") REFERENCES "tag_learning_goals"("tag_learninggoal_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tag_level_id_fkey" FOREIGN KEY ("tag_level_id") REFERENCES "tag_levels"("tag_level_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tag_studyday_id_fkey" FOREIGN KEY ("tag_studyday_id") REFERENCES "tag_study_days"("tag_studyday_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tag_studystyle_id_fkey" FOREIGN KEY ("tag_studystyle_id") REFERENCES "tag_study_styles"("tag_studystyle_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tag_studytime_id_fkey" FOREIGN KEY ("tag_studytime_id") REFERENCES "tag_study_times"("tag_studytime_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tag_subject_id_fkey" FOREIGN KEY ("tag_subject_id") REFERENCES "tag_subjects"("tag_subject_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiper_id_fkey" FOREIGN KEY ("swiper_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "connection_requests"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_swipe1_id_fkey" FOREIGN KEY ("swipe1_id") REFERENCES "swipes"("swipe_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_swipe2_id_fkey" FOREIGN KEY ("swipe2_id") REFERENCES "swipes"("swipe_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_last_message_id_fkey" FOREIGN KEY ("last_message_id") REFERENCES "messages"("message_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("match_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("call_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("message_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_caller_id_fkey" FOREIGN KEY ("caller_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_ended_by_id_fkey" FOREIGN KEY ("ended_by_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderations" ADD CONSTRAINT "moderations_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("message_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderations" ADD CONSTRAINT "moderations_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderations" ADD CONSTRAINT "moderations_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderations" ADD CONSTRAINT "moderations_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderations" ADD CONSTRAINT "moderations_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "violation_keywords"("word_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_moderation_id_fkey" FOREIGN KEY ("moderation_id") REFERENCES "moderations"("moderation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("match_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_moderation_id_fkey" FOREIGN KEY ("moderation_id") REFERENCES "moderations"("moderation_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "connection_requests"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_study_slots" ADD CONSTRAINT "user_study_slots_tag_studyday_id_fkey" FOREIGN KEY ("tag_studyday_id") REFERENCES "tag_study_days"("tag_studyday_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_study_slots" ADD CONSTRAINT "user_study_slots_tag_studytime_id_fkey" FOREIGN KEY ("tag_studytime_id") REFERENCES "tag_study_times"("tag_studytime_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_study_slots" ADD CONSTRAINT "user_study_slots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_style_stats" ADD CONSTRAINT "user_style_stats_tag_studystyle_id_fkey" FOREIGN KEY ("tag_studystyle_id") REFERENCES "tag_study_styles"("tag_studystyle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_style_stats" ADD CONSTRAINT "user_style_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_goal_stats" ADD CONSTRAINT "user_goal_stats_tag_learninggoal_id_fkey" FOREIGN KEY ("tag_learninggoal_id") REFERENCES "tag_learning_goals"("tag_learninggoal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_goal_stats" ADD CONSTRAINT "user_goal_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
