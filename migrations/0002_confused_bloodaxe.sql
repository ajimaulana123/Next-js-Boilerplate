ALTER TABLE "users" RENAME COLUMN "name" TO "clerk_user_id";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(60);