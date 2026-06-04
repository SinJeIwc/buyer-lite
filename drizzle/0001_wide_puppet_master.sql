ALTER TABLE "currencies" DROP CONSTRAINT "currencies_code_unique";--> statement-breakpoint
ALTER TABLE "currencies" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "currencies" ADD CONSTRAINT "currencies_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;