


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."ai_channel" AS ENUM (
    'whatsapp',
    'call',
    'web_chat',
    'instagram'
);


ALTER TYPE "public"."ai_channel" OWNER TO "postgres";


CREATE TYPE "public"."ai_sender" AS ENUM (
    'user',
    'assistant',
    'system',
    'human'
);


ALTER TYPE "public"."ai_sender" OWNER TO "postgres";


CREATE TYPE "public"."business_role" AS ENUM (
    'owner',
    'admin',
    'manager',
    'waiter',
    'kitchen',
    'cashier',
    'viewer',
    'ai_agent'
);


ALTER TYPE "public"."business_role" OWNER TO "postgres";


CREATE TYPE "public"."kitchen_ticket_status" AS ENUM (
    'queued',
    'in_progress',
    'ready',
    'delivered',
    'cancelled'
);


ALTER TYPE "public"."kitchen_ticket_status" OWNER TO "postgres";


CREATE TYPE "public"."order_source" AS ENUM (
    'waiter',
    'whatsapp',
    'web',
    'call_ai',
    'qr',
    'admin'
);


ALTER TYPE "public"."order_source" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'served',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."order_type" AS ENUM (
    'dine_in',
    'takeaway',
    'delivery',
    'reservation'
);


ALTER TYPE "public"."order_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cash',
    'card',
    'transfer',
    'online',
    'mixed'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'unpaid',
    'partial',
    'paid',
    'refunded',
    'failed'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."reservation_status" AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
);


ALTER TYPE "public"."reservation_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'trial',
    'active',
    'past_due',
    'cancelled',
    'expired'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."table_status" AS ENUM (
    'available',
    'occupied',
    'reserved',
    'inactive'
);


ALTER TYPE "public"."table_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_business_access"("target_business_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select exists (
    select 1
    from business_users
    where business_users.business_id = target_business_id
      and business_users.user_id = auth.uid()
      and business_users.is_active = true
  );
$$;


ALTER FUNCTION "public"."user_has_business_access"("target_business_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "conversation_id" "uuid",
    "action_type" "text" NOT NULL,
    "related_order_id" "uuid",
    "related_reservation_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "ai_actions_action_reference_check" CHECK ((NOT (("related_order_id" IS NOT NULL) AND ("related_reservation_id" IS NOT NULL))))
);


ALTER TABLE "public"."ai_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" DEFAULT 'Aurora'::"text",
    "tone" "text" DEFAULT 'professional'::"text",
    "instructions" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "channel" "public"."ai_channel" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender" "public"."ai_sender" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "tax_percentage" numeric(10,2) DEFAULT 0,
    "service_fee_percentage" numeric(10,2) DEFAULT 0,
    "allow_online_orders" boolean DEFAULT true,
    "allow_reservations" boolean DEFAULT true,
    "allow_ai_whatsapp" boolean DEFAULT false,
    "allow_ai_calls" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."business_role" DEFAULT 'viewer'::"public"."business_role" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "cover_image_url" "text",
    "primary_color" "text" DEFAULT '#000000'::"text",
    "secondary_color" "text" DEFAULT '#FFFFFF'::"text",
    "industry" "text",
    "phone" "text",
    "email" "text",
    "address" "text",
    "city" "text",
    "country" "text",
    "timezone" "text" DEFAULT 'America/Bogota'::"text",
    "currency" "text" DEFAULT 'COP'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text",
    "reference" "text",
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customer_addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "email" "text",
    "address" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "quantity" integer DEFAULT 1,
    "unit_price" numeric(12,2) DEFAULT 0,
    "total_price" numeric(12,2) DEFAULT 0
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "customer_id" "uuid",
    "invoice_number" "text",
    "subtotal" numeric(12,2) DEFAULT 0,
    "tax_amount" numeric(12,2) DEFAULT 0,
    "total" numeric(12,2) DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "pdf_url" "text",
    "issued_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kitchen_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" "public"."kitchen_ticket_status" DEFAULT 'queued'::"public"."kitchen_ticket_status",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."kitchen_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."menu_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_item_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "order_item_id" "uuid" NOT NULL,
    "option_name" "text" NOT NULL,
    "option_value" "text" NOT NULL,
    "extra_price" numeric(12,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_item_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "product_name" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_price" numeric(12,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "table_id" "uuid",
    "customer_id" "uuid",
    "waiter_id" "uuid",
    "order_type" "public"."order_type" DEFAULT 'dine_in'::"public"."order_type",
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status",
    "payment_status" "public"."payment_status" DEFAULT 'unpaid'::"public"."payment_status",
    "subtotal" numeric(12,2) DEFAULT 0,
    "tax_amount" numeric(12,2) DEFAULT 0,
    "service_fee" numeric(12,2) DEFAULT 0,
    "discount_amount" numeric(12,2) DEFAULT 0,
    "total" numeric(12,2) DEFAULT 0,
    "notes" "text",
    "source" "public"."order_source" DEFAULT 'waiter'::"public"."order_source",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reservation_id" "uuid",
    "delivery_address_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "method" "public"."payment_method" NOT NULL,
    "status" "public"."payment_status" DEFAULT 'unpaid'::"public"."payment_status",
    "provider" "text",
    "provider_reference" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(12,2) DEFAULT 0,
    "currency" "text" DEFAULT 'COP'::"text",
    "max_users" integer,
    "max_orders" integer,
    "allow_ai" boolean DEFAULT false,
    "allow_calls" boolean DEFAULT false,
    "allow_whatsapp" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_option_values" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "option_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "extra_price" numeric(12,2) DEFAULT 0,
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_option_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "is_required" boolean DEFAULT false,
    "min_select" integer DEFAULT 0,
    "max_select" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(12,2) DEFAULT 0 NOT NULL,
    "image_url" "text",
    "is_available" boolean DEFAULT true,
    "preparation_time_minutes" integer,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "phone" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "table_id" "uuid",
    "reservation_date" "date" NOT NULL,
    "reservation_time" time without time zone NOT NULL,
    "people_count" integer DEFAULT 1 NOT NULL,
    "status" "public"."reservation_status" DEFAULT 'pending'::"public"."reservation_status",
    "notes" "text",
    "source" "public"."order_source" DEFAULT 'web'::"public"."order_source",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurant_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "area_id" "uuid",
    "table_number" "text" NOT NULL,
    "capacity" integer DEFAULT 2,
    "status" "public"."table_status" DEFAULT 'available'::"public"."table_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."restaurant_tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "status" "public"."subscription_status" DEFAULT 'trial'::"public"."subscription_status",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_actions"
    ADD CONSTRAINT "ai_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_areas"
    ADD CONSTRAINT "business_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_settings"
    ADD CONSTRAINT "business_settings_business_id_key" UNIQUE ("business_id");



ALTER TABLE ONLY "public"."business_settings"
    ADD CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_users"
    ADD CONSTRAINT "business_users_business_id_user_id_key" UNIQUE ("business_id", "user_id");



ALTER TABLE ONLY "public"."business_users"
    ADD CONSTRAINT "business_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."customer_addresses"
    ADD CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kitchen_tickets"
    ADD CONSTRAINT "kitchen_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_item_options"
    ADD CONSTRAINT "order_item_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_option_values"
    ADD CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_options"
    ADD CONSTRAINT "product_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurant_tables"
    ADD CONSTRAINT "restaurant_tables_business_id_table_number_key" UNIQUE ("business_id", "table_number");



ALTER TABLE ONLY "public"."restaurant_tables"
    ADD CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "customers_business_id_email_key" ON "public"."customers" USING "btree" ("business_id", "email") WHERE ("email" IS NOT NULL);



CREATE UNIQUE INDEX "customers_business_id_phone_key" ON "public"."customers" USING "btree" ("business_id", "phone") WHERE ("phone" IS NOT NULL);



CREATE INDEX "idx_ai_actions_business_id" ON "public"."ai_actions" USING "btree" ("business_id");



CREATE INDEX "idx_ai_actions_conversation_id" ON "public"."ai_actions" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_conversations_business_id" ON "public"."ai_conversations" USING "btree" ("business_id");



CREATE INDEX "idx_ai_messages_conversation_id" ON "public"."ai_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_business_users_business_id" ON "public"."business_users" USING "btree" ("business_id");



CREATE INDEX "idx_business_users_user_id" ON "public"."business_users" USING "btree" ("user_id");



CREATE INDEX "idx_customer_addresses_customer_id" ON "public"."customer_addresses" USING "btree" ("customer_id");



CREATE INDEX "idx_customers_business_id" ON "public"."customers" USING "btree" ("business_id");



CREATE INDEX "idx_invoices_business_id" ON "public"."invoices" USING "btree" ("business_id");



CREATE INDEX "idx_invoices_customer_id" ON "public"."invoices" USING "btree" ("customer_id");



CREATE INDEX "idx_invoices_order_id" ON "public"."invoices" USING "btree" ("order_id");



CREATE INDEX "idx_kitchen_tickets_order_id" ON "public"."kitchen_tickets" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_business_id" ON "public"."order_items" USING "btree" ("business_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_business_created_at" ON "public"."orders" USING "btree" ("business_id", "created_at");



CREATE INDEX "idx_orders_business_id" ON "public"."orders" USING "btree" ("business_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_customer_id" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "idx_orders_delivery_address_id" ON "public"."orders" USING "btree" ("delivery_address_id");



CREATE INDEX "idx_orders_reservation_id" ON "public"."orders" USING "btree" ("reservation_id");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_table_id" ON "public"."orders" USING "btree" ("table_id");



CREATE INDEX "idx_orders_waiter_id" ON "public"."orders" USING "btree" ("waiter_id");



CREATE INDEX "idx_payments_business_id" ON "public"."payments" USING "btree" ("business_id");



CREATE INDEX "idx_product_option_values_option_id" ON "public"."product_option_values" USING "btree" ("option_id");



CREATE INDEX "idx_product_options_product_id" ON "public"."product_options" USING "btree" ("product_id");



CREATE INDEX "idx_products_business_id" ON "public"."products" USING "btree" ("business_id");



CREATE INDEX "idx_products_category_id" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_reservations_business_id" ON "public"."reservations" USING "btree" ("business_id");



CREATE INDEX "idx_reservations_customer_id" ON "public"."reservations" USING "btree" ("customer_id");



CREATE INDEX "idx_reservations_table_id" ON "public"."reservations" USING "btree" ("table_id");



CREATE UNIQUE INDEX "subscriptions_one_active_per_business" ON "public"."subscriptions" USING "btree" ("business_id") WHERE ("status" = 'active'::"public"."subscription_status");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."kitchen_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."reservations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."restaurant_tables" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_actions"
    ADD CONSTRAINT "ai_actions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_actions"
    ADD CONSTRAINT "ai_actions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_actions"
    ADD CONSTRAINT "ai_actions_related_order_id_fkey" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_actions"
    ADD CONSTRAINT "ai_actions_related_reservation_id_fkey" FOREIGN KEY ("related_reservation_id") REFERENCES "public"."reservations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_agents"
    ADD CONSTRAINT "ai_agents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_areas"
    ADD CONSTRAINT "business_areas_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_settings"
    ADD CONSTRAINT "business_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_users"
    ADD CONSTRAINT "business_users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_users"
    ADD CONSTRAINT "business_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_addresses"
    ADD CONSTRAINT "customer_addresses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_addresses"
    ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."kitchen_tickets"
    ADD CONSTRAINT "kitchen_tickets_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kitchen_tickets"
    ADD CONSTRAINT "kitchen_tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_categories"
    ADD CONSTRAINT "menu_categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_item_options"
    ADD CONSTRAINT "order_item_options_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_item_options"
    ADD CONSTRAINT "order_item_options_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."restaurant_tables"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_waiter_id_fkey" FOREIGN KEY ("waiter_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_option_values"
    ADD CONSTRAINT "product_option_values_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_option_values"
    ADD CONSTRAINT "product_option_values_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."product_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_options"
    ADD CONSTRAINT "product_options_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_options"
    ADD CONSTRAINT "product_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "public"."restaurant_tables"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."restaurant_tables"
    ADD CONSTRAINT "restaurant_tables_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."business_areas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."restaurant_tables"
    ADD CONSTRAINT "restaurant_tables_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE SET NULL;



CREATE POLICY "Authenticated users can view plans" ON "public"."plans" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Business access activity_logs" ON "public"."activity_logs" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access ai_actions" ON "public"."ai_actions" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access ai_agents" ON "public"."ai_agents" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access ai_conversations" ON "public"."ai_conversations" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access ai_messages" ON "public"."ai_messages" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access business_areas" ON "public"."business_areas" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access business_settings" ON "public"."business_settings" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access customer_addresses" ON "public"."customer_addresses" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access customers" ON "public"."customers" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access invoice_items" ON "public"."invoice_items" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access invoices" ON "public"."invoices" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access kitchen_tickets" ON "public"."kitchen_tickets" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access menu_categories" ON "public"."menu_categories" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access order_item_options" ON "public"."order_item_options" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access order_items" ON "public"."order_items" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access orders" ON "public"."orders" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access payments" ON "public"."payments" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access product_option_values" ON "public"."product_option_values" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access product_options" ON "public"."product_options" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access products" ON "public"."products" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access reservations" ON "public"."reservations" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access restaurant_tables" ON "public"."restaurant_tables" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Business access subscriptions" ON "public"."subscriptions" USING ("public"."user_has_business_access"("business_id")) WITH CHECK ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view business users" ON "public"."business_users" FOR SELECT USING ("public"."user_has_business_access"("business_id"));



CREATE POLICY "Users can view their businesses" ON "public"."businesses" FOR SELECT USING ("public"."user_has_business_access"("id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kitchen_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_item_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_option_values" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurant_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_business_access"("target_business_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_business_access"("target_business_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_business_access"("target_business_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_actions" TO "anon";
GRANT ALL ON TABLE "public"."ai_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_actions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agents" TO "anon";
GRANT ALL ON TABLE "public"."ai_agents" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agents" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."business_areas" TO "anon";
GRANT ALL ON TABLE "public"."business_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."business_areas" TO "service_role";



GRANT ALL ON TABLE "public"."business_settings" TO "anon";
GRANT ALL ON TABLE "public"."business_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."business_settings" TO "service_role";



GRANT ALL ON TABLE "public"."business_users" TO "anon";
GRANT ALL ON TABLE "public"."business_users" TO "authenticated";
GRANT ALL ON TABLE "public"."business_users" TO "service_role";



GRANT ALL ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT ALL ON TABLE "public"."customer_addresses" TO "anon";
GRANT ALL ON TABLE "public"."customer_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_addresses" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."kitchen_tickets" TO "anon";
GRANT ALL ON TABLE "public"."kitchen_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."kitchen_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."menu_categories" TO "anon";
GRANT ALL ON TABLE "public"."menu_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_categories" TO "service_role";



GRANT ALL ON TABLE "public"."order_item_options" TO "anon";
GRANT ALL ON TABLE "public"."order_item_options" TO "authenticated";
GRANT ALL ON TABLE "public"."order_item_options" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."product_option_values" TO "anon";
GRANT ALL ON TABLE "public"."product_option_values" TO "authenticated";
GRANT ALL ON TABLE "public"."product_option_values" TO "service_role";



GRANT ALL ON TABLE "public"."product_options" TO "anon";
GRANT ALL ON TABLE "public"."product_options" TO "authenticated";
GRANT ALL ON TABLE "public"."product_options" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."restaurant_tables" TO "anon";
GRANT ALL ON TABLE "public"."restaurant_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurant_tables" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







