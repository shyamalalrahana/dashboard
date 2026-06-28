CREATE TABLE "customer_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"date" text NOT NULL,
	"amount" integer NOT NULL,
	"paid_amount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"items" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"date" text NOT NULL,
	"amount" integer NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text,
	"outstanding" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retail_sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"qty" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"line_total" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retail_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_number" text NOT NULL,
	"customer_name" text,
	"customer_phone" text,
	"customer_email" text,
	"payment_method" text DEFAULT 'Cash' NOT NULL,
	"total_amount" integer NOT NULL,
	"status" text DEFAULT 'Paid' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "retail_sales_sale_number_unique" UNIQUE("sale_number")
);
--> statement-breakpoint
CREATE TABLE "wholesale_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"customer" text NOT NULL,
	"date" text NOT NULL,
	"amount" integer NOT NULL,
	"profit" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"payment_method" text DEFAULT 'Cash' NOT NULL,
	"due_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wholesale_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"opening_stock" integer DEFAULT 0 NOT NULL,
	"minimum_stock" integer DEFAULT 0 NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_item_code_unique" UNIQUE("item_code")
);
--> statement-breakpoint
CREATE TABLE "stock_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"balance" integer NOT NULL,
	"notes" text,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_number" text NOT NULL,
	"category" text NOT NULL,
	"note" text,
	"vendor" text,
	"date" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"payment_method" text DEFAULT 'Cash' NOT NULL,
	"has_attachment" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_expense_number_unique" UNIQUE("expense_number")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role_id" uuid,
	"status" text DEFAULT 'Active' NOT NULL,
	"join_date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"barcode" text DEFAULT '',
	"name" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"brand" text DEFAULT '',
	"product_type" text DEFAULT 'Goods' NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"pack_size" text DEFAULT '',
	"pack_unit" text DEFAULT '',
	"pack_display_name" text DEFAULT '',
	"mrp" integer DEFAULT 0 NOT NULL,
	"selling_price" integer DEFAULT 0 NOT NULL,
	"cost_price" integer DEFAULT 0 NOT NULL,
	"min_selling_price" integer DEFAULT 0 NOT NULL,
	"gst_enabled" boolean DEFAULT true NOT NULL,
	"tax_mode" text DEFAULT 'Exclusive' NOT NULL,
	"gst_rate" text DEFAULT '0' NOT NULL,
	"hsn" text DEFAULT '',
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0 NOT NULL,
	"reorder_level" integer DEFAULT 0 NOT NULL,
	"location" text DEFAULT '',
	"expiry_tracking" boolean DEFAULT false NOT NULL,
	"shelf_life" text DEFAULT '',
	"expiry_date" text DEFAULT '',
	"offer_enabled" boolean DEFAULT false NOT NULL,
	"offer_type" text DEFAULT 'percent',
	"offer_value" numeric(10, 2) DEFAULT '0',
	"offer_label" text DEFAULT '',
	"description" text DEFAULT '',
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retail_sale_items" ADD CONSTRAINT "retail_sale_items_sale_id_retail_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."retail_sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;