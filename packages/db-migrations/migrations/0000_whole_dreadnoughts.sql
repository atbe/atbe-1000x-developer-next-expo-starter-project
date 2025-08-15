CREATE SCHEMA IF NOT EXISTS "app";
--> statement-breakpoint
CREATE TYPE "app"."billing_event_status" AS ENUM('pending', 'processed', 'failed', 'ignored');--> statement-breakpoint
CREATE TYPE "app"."billing_event_type" AS ENUM('account.updated', 'account.application.authorized', 'account.application.deauthorized', 'account.external_account.created', 'account.external_account.deleted', 'account.external_account.updated', 'balance.available', 'billing_portal.configuration.created', 'billing_portal.configuration.updated', 'billing_portal.session.created', 'charge.captured', 'charge.expired', 'charge.failed', 'charge.pending', 'charge.refunded', 'charge.succeeded', 'charge.updated', 'charge.dispute.closed', 'charge.dispute.created', 'charge.dispute.funds_reinstated', 'charge.dispute.funds_withdrawn', 'charge.dispute.updated', 'charge.refund.updated', 'checkout.session.async_payment_failed', 'checkout.session.async_payment_succeeded', 'checkout.session.completed', 'checkout.session.expired', 'customer.created', 'customer.deleted', 'customer.updated', 'customer.discount.created', 'customer.discount.deleted', 'customer.discount.updated', 'customer.source.created', 'customer.source.deleted', 'customer.source.expiring', 'customer.source.updated', 'customer.subscription.created', 'customer.subscription.deleted', 'customer.subscription.paused', 'customer.subscription.pending_update_applied', 'customer.subscription.pending_update_expired', 'customer.subscription.resumed', 'customer.subscription.trial_will_end', 'customer.subscription.updated', 'customer.tax_id.created', 'customer.tax_id.deleted', 'customer.tax_id.updated', 'invoice.created', 'invoice.deleted', 'invoice.finalization_failed', 'invoice.finalized', 'invoice.marked_uncollectible', 'invoice.paid', 'invoice.payment_action_required', 'invoice.payment_failed', 'invoice.payment_succeeded', 'invoice.sent', 'invoice.upcoming', 'invoice.updated', 'invoice.voided', 'invoiceitem.created', 'invoiceitem.deleted', 'invoice_payment.paid', 'payment_intent.amount_capturable_updated', 'payment_intent.canceled', 'payment_intent.created', 'payment_intent.partially_funded', 'payment_intent.payment_failed', 'payment_intent.processing', 'payment_intent.requires_action', 'payment_intent.succeeded', 'payment_method.attached', 'payment_method.automatically_updated', 'payment_method.detached', 'payment_method.updated', 'payout.canceled', 'payout.created', 'payout.failed', 'payout.paid', 'payout.reconciliation_completed', 'payout.updated', 'plan.created', 'plan.deleted', 'plan.updated', 'price.created', 'price.deleted', 'price.updated', 'product.created', 'product.deleted', 'product.updated', 'setup_intent.canceled', 'setup_intent.created', 'setup_intent.requires_action', 'setup_intent.setup_failed', 'setup_intent.succeeded', 'subscription_schedule.aborted', 'subscription_schedule.canceled', 'subscription_schedule.completed', 'subscription_schedule.created', 'subscription_schedule.expiring', 'subscription_schedule.released', 'subscription_schedule.updated', 'tax_rate.created', 'tax_rate.updated', 'transfer.created', 'transfer.reversed', 'transfer.updated');--> statement-breakpoint
CREATE TYPE "app"."subscription_tier" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TYPE "app"."system_event_type" AS ENUM('subscription_created', 'subscription_updated', 'subscription_cancelled', 'user_role_created', 'user_role_updated', 'user_created', 'user_updated', 'user_deleted');--> statement-breakpoint
CREATE TYPE "app"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "app"."billing_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"stripe_event_id" text NOT NULL,
	"user_id" uuid,
	"stripe_customer_id" text,
	"event_type" "app"."billing_event_type" NOT NULL,
	"status" "app"."billing_event_status" DEFAULT 'pending' NOT NULL,
	"event_data" jsonb NOT NULL,
	"stripe_event_created_at" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "app"."subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" "app"."subscription_tier" DEFAULT 'premium' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "app"."system_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_type" "app"."system_event_type" NOT NULL,
	"user_id" uuid,
	"actor_id" text,
	"entity_id" text,
	"entity_type" text,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "app"."user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app"."user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "app"."billing_events" ADD CONSTRAINT "billing_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."system_events" ADD CONSTRAINT "system_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;