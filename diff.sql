-- DropForeignKey
ALTER TABLE "auth"."identities" DROP CONSTRAINT "identities_user_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."mfa_amr_claims" DROP CONSTRAINT "mfa_amr_claims_session_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."mfa_challenges" DROP CONSTRAINT "mfa_challenges_auth_factor_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."mfa_factors" DROP CONSTRAINT "mfa_factors_user_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."oauth_authorizations" DROP CONSTRAINT "oauth_authorizations_client_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."oauth_authorizations" DROP CONSTRAINT "oauth_authorizations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."oauth_consents" DROP CONSTRAINT "oauth_consents_client_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."oauth_consents" DROP CONSTRAINT "oauth_consents_user_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."one_time_tokens" DROP CONSTRAINT "one_time_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."refresh_tokens" DROP CONSTRAINT "refresh_tokens_session_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."saml_providers" DROP CONSTRAINT "saml_providers_sso_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."saml_relay_states" DROP CONSTRAINT "saml_relay_states_flow_state_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."saml_relay_states" DROP CONSTRAINT "saml_relay_states_sso_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."sessions" DROP CONSTRAINT "sessions_oauth_client_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."sso_domains" DROP CONSTRAINT "sso_domains_sso_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."webauthn_challenges" DROP CONSTRAINT "webauthn_challenges_user_id_fkey";

-- DropForeignKey
ALTER TABLE "auth"."webauthn_credentials" DROP CONSTRAINT "webauthn_credentials_user_id_fkey";

-- DropForeignKey
ALTER TABLE "AIGenerationLog" DROP CONSTRAINT "AIGenerationLog_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Affiliate" DROP CONSTRAINT "Affiliate_store_id_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateReferral" DROP CONSTRAINT "AffiliateReferral_affiliate_id_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateReferral" DROP CONSTRAINT "AffiliateReferral_referred_store_id_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateTransaction" DROP CONSTRAINT "AffiliateTransaction_affiliate_id_fkey";

-- DropForeignKey
ALTER TABLE "AffiliateTransaction" DROP CONSTRAINT "AffiliateTransaction_referral_id_fkey";

-- DropForeignKey
ALTER TABLE "Ambassador" DROP CONSTRAINT "Ambassador_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Ambassador" DROP CONSTRAINT "Ambassador_user_id_fkey";

-- DropForeignKey
ALTER TABLE "AmbassadorReferral" DROP CONSTRAINT "AmbassadorReferral_ambassador_id_fkey";

-- DropForeignKey
ALTER TABLE "AmbassadorReferral" DROP CONSTRAINT "AmbassadorReferral_vendor_store_id_fkey";

-- DropForeignKey
ALTER TABLE "AmbassadorTransaction" DROP CONSTRAINT "AmbassadorTransaction_ambassador_id_fkey";

-- DropForeignKey
ALTER TABLE "AmbassadorTransaction" DROP CONSTRAINT "AmbassadorTransaction_referral_id_fkey";

-- DropForeignKey
ALTER TABLE "CommunityComment" DROP CONSTRAINT "CommunityComment_post_id_fkey";

-- DropForeignKey
ALTER TABLE "CommunityComment" DROP CONSTRAINT "CommunityComment_store_id_fkey";

-- DropForeignKey
ALTER TABLE "CommunityLike" DROP CONSTRAINT "CommunityLike_post_id_fkey";

-- DropForeignKey
ALTER TABLE "CommunityLike" DROP CONSTRAINT "CommunityLike_store_id_fkey";

-- DropForeignKey
ALTER TABLE "CommunityPost" DROP CONSTRAINT "CommunityPost_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_reporter_id_fkey";

-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_order_id_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_referred_by_fkey";

-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "store_referred_by_ambassador_fkey";

-- DropForeignKey
ALTER TABLE "TelegramCommunity" DROP CONSTRAINT "TelegramCommunity_product_id_fkey";

-- DropForeignKey
ALTER TABLE "TelegramCommunity" DROP CONSTRAINT "TelegramCommunity_store_id_fkey";

-- DropForeignKey
ALTER TABLE "TelegramCommunityAccess" DROP CONSTRAINT "TelegramCommunityAccess_community_id_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT "WithdrawalRequest_store_id_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT "WithdrawalRequest_wallet_id_fkey";

-- DropForeignKey
ALTER TABLE "telegram_link_tokens" DROP CONSTRAINT "telegram_link_tokens_store_id_fkey";

-- DropIndex
DROP INDEX "idx_admin_log_admin";

-- DropIndex
DROP INDEX "idx_admin_log_created_at";

-- DropIndex
DROP INDEX "idx_admin_log_target";

-- DropIndex
DROP INDEX "Affiliate_code_key";

-- DropIndex
DROP INDEX "Affiliate_store_id_key";

-- DropIndex
DROP INDEX "idx_affiliate_code";

-- DropIndex
DROP INDEX "idx_affiliate_store_id";

-- DropIndex
DROP INDEX "BlockedDate_store_id_date_key";

-- DropIndex
DROP INDEX "Notification_created_at_idx";

-- DropIndex
DROP INDEX "Notification_user_id_idx";

-- DropIndex
DROP INDEX "NpsResponse_user_id_idx";

-- DropIndex
DROP INDEX "idx_order_is_archived";

-- DropIndex
DROP INDEX "idx_order_product_id";

-- DropIndex
DROP INDEX "idx_order_promo_id";

-- DropIndex
DROP INDEX "idx_order_status_updated";

-- DropIndex
DROP INDEX "idx_product_variant_product_id";

-- DropIndex
DROP INDEX "idx_shortlink_store_id";

-- DropIndex
DROP INDEX "idx_subscription_vendor_id";

-- DropIndex
DROP INDEX "idx_withdrawal_wallet_id";

-- AlterTable
ALTER TABLE "Affiliate" DROP COLUMN "active_referred",
DROP COLUMN "balance",
DROP COLUMN "code",
DROP COLUMN "is_active",
DROP COLUMN "store_id",
DROP COLUMN "total_referred",
DROP COLUMN "updated_at",
ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "conversions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "token" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "vendor_id" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "total_earned" SET NOT NULL,
ALTER COLUMN "total_earned" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "commission_rate" SET NOT NULL,
ALTER COLUMN "commission_rate" DROP DEFAULT,
ALTER COLUMN "commission_rate" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BlockedDate" DROP COLUMN "created_at";

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "NpsResponse" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "is_archived",
DROP COLUMN "last_reminder_at";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sales" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "views" SET NOT NULL,
ALTER COLUMN "resale_allowed" SET NOT NULL,
ALTER COLUMN "resale_commission" SET NOT NULL,
ALTER COLUMN "resale_commission" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "coaching_is_pack" SET NOT NULL;

-- AlterTable
ALTER TABLE "SalePage" DROP COLUMN "custom_domain",
DROP COLUMN "sales_count",
DROP COLUMN "views_count";

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "contract_accepted",
DROP COLUMN "contract_accepted_at",
DROP COLUMN "google_tag_id",
DROP COLUMN "is_active",
DROP COLUMN "referred_by",
DROP COLUMN "referred_by_ambassador",
DROP COLUMN "registration_month",
DROP COLUMN "telegram_chat_id",
DROP COLUMN "telegram_notifications",
DROP COLUMN "withdrawal_method",
DROP COLUMN "withdrawal_name",
DROP COLUMN "withdrawal_number",
ADD COLUMN     "payout_provider" TEXT,
ADD COLUMN     "payout_wallet_number" TEXT,
ALTER COLUMN "coaching_auto_accept" SET NOT NULL,
ALTER COLUMN "coaching_buffer_time" SET NOT NULL,
ALTER COLUMN "coaching_max_future_days" SET NOT NULL;

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "phone_or_iban" TEXT,
ADD COLUMN     "store_id" TEXT;

-- DropTable
DROP TABLE "auth"."audit_log_entries";

-- DropTable
DROP TABLE "auth"."custom_oauth_providers";

-- DropTable
DROP TABLE "auth"."flow_state";

-- DropTable
DROP TABLE "auth"."identities";

-- DropTable
DROP TABLE "auth"."instances";

-- DropTable
DROP TABLE "auth"."mfa_amr_claims";

-- DropTable
DROP TABLE "auth"."mfa_challenges";

-- DropTable
DROP TABLE "auth"."mfa_factors";

-- DropTable
DROP TABLE "auth"."oauth_authorizations";

-- DropTable
DROP TABLE "auth"."oauth_client_states";

-- DropTable
DROP TABLE "auth"."oauth_clients";

-- DropTable
DROP TABLE "auth"."oauth_consents";

-- DropTable
DROP TABLE "auth"."one_time_tokens";

-- DropTable
DROP TABLE "auth"."refresh_tokens";

-- DropTable
DROP TABLE "auth"."saml_providers";

-- DropTable
DROP TABLE "auth"."saml_relay_states";

-- DropTable
DROP TABLE "auth"."schema_migrations";

-- DropTable
DROP TABLE "auth"."sessions";

-- DropTable
DROP TABLE "auth"."sso_domains";

-- DropTable
DROP TABLE "auth"."sso_providers";

-- DropTable
DROP TABLE "auth"."users";

-- DropTable
DROP TABLE "auth"."webauthn_challenges";

-- DropTable
DROP TABLE "auth"."webauthn_credentials";

-- DropTable
DROP TABLE "AIGenerationLog";

-- DropTable
DROP TABLE "AffiliateReferral";

-- DropTable
DROP TABLE "AffiliateTransaction";

-- DropTable
DROP TABLE "Ambassador";

-- DropTable
DROP TABLE "AmbassadorReferral";

-- DropTable
DROP TABLE "AmbassadorTransaction";

-- DropTable
DROP TABLE "CommunityComment";

-- DropTable
DROP TABLE "CommunityLike";

-- DropTable
DROP TABLE "CommunityPost";

-- DropTable
DROP TABLE "Complaint";

-- DropTable
DROP TABLE "ProductQuestion";

-- DropTable
DROP TABLE "Review";

-- DropTable
DROP TABLE "TelegramCommunity";

-- DropTable
DROP TABLE "TelegramCommunityAccess";

-- DropTable
DROP TABLE "WithdrawalRequest";

-- DropTable
DROP TABLE "telegram_link_tokens";

-- DropEnum
DROP TYPE "auth"."aal_level";

-- DropEnum
DROP TYPE "auth"."code_challenge_method";

-- DropEnum
DROP TYPE "auth"."factor_status";

-- DropEnum
DROP TYPE "auth"."factor_type";

-- DropEnum
DROP TYPE "auth"."oauth_authorization_status";

-- DropEnum
DROP TYPE "auth"."oauth_client_type";

-- DropEnum
DROP TYPE "auth"."oauth_registration_type";

-- DropEnum
DROP TYPE "auth"."oauth_response_type";

-- DropEnum
DROP TYPE "auth"."one_time_token_type";

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_token_key" ON "Affiliate"("token");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

