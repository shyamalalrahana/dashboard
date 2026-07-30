CREATE TABLE `customer_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`items` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customer_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`address` text,
	`outstanding` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `retail_sale_items` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_id` text NOT NULL,
	`product_id` text,
	`product_name` text NOT NULL,
	`product_sku` text,
	`qty` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `retail_sales`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `retail_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`sale_number` text NOT NULL,
	`customer_name` text,
	`customer_phone` text,
	`customer_email` text,
	`payment_method` text DEFAULT 'Cash' NOT NULL,
	`subtotal` integer DEFAULT 0 NOT NULL,
	`gst_amount` integer DEFAULT 0 NOT NULL,
	`total_amount` integer NOT NULL,
	`status` text DEFAULT 'Paid' NOT NULL,
	`sold_by` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `retail_sales_sale_number_unique` ON `retail_sales` (`sale_number`);--> statement-breakpoint
CREATE TABLE `wholesale_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`customer` text NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`profit` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`payment_method` text DEFAULT 'Cash' NOT NULL,
	`due_date` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wholesale_invoices_invoice_number_unique` ON `wholesale_invoices` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`item_code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`opening_stock` integer DEFAULT 0 NOT NULL,
	`minimum_stock` integer DEFAULT 0 NOT NULL,
	`current_stock` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_items_item_code_unique` ON `inventory_items` (`item_code`);--> statement-breakpoint
CREATE TABLE `stock_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`balance` integer NOT NULL,
	`notes` text,
	`date` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`expense_number` text NOT NULL,
	`category` text NOT NULL,
	`note` text,
	`vendor` text,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'Pending' NOT NULL,
	`payment_method` text DEFAULT 'Cash' NOT NULL,
	`has_attachment` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `expenses_expense_number_unique` ON `expenses` (`expense_number`);--> statement-breakpoint
CREATE TABLE `activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_id` text,
	`staff_name` text,
	`action` text NOT NULL,
	`entity` text,
	`entity_id` text,
	`detail` text DEFAULT '{}',
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`permissions` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`staff_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`role_id` text,
	`status` text DEFAULT 'Active' NOT NULL,
	`join_date` text NOT NULL,
	`password_hash` text,
	`pin_hash` text,
	`must_reset` integer DEFAULT false NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_email_unique` ON `staff` (`email`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`barcode` text DEFAULT '',
	`name` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`brand` text DEFAULT '',
	`product_type` text DEFAULT 'Goods' NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`unit` text DEFAULT 'pcs' NOT NULL,
	`pack_size` text DEFAULT '',
	`pack_unit` text DEFAULT '',
	`pack_display_name` text DEFAULT '',
	`mrp` integer DEFAULT 0 NOT NULL,
	`selling_price` integer DEFAULT 0 NOT NULL,
	`cost_price` integer DEFAULT 0 NOT NULL,
	`min_selling_price` integer DEFAULT 0 NOT NULL,
	`wholesale_price` integer DEFAULT 0 NOT NULL,
	`distributor_price` integer DEFAULT 0 NOT NULL,
	`gst_enabled` integer DEFAULT true NOT NULL,
	`tax_mode` text DEFAULT 'Exclusive' NOT NULL,
	`gst_rate` text DEFAULT '0' NOT NULL,
	`tax_profile` text DEFAULT '',
	`hsn` text DEFAULT '',
	`stock` integer DEFAULT 0 NOT NULL,
	`min_stock` integer DEFAULT 0 NOT NULL,
	`max_stock` integer DEFAULT 0 NOT NULL,
	`reorder_level` integer DEFAULT 0 NOT NULL,
	`warehouse` text DEFAULT '',
	`location` text DEFAULT '',
	`rack` text DEFAULT '',
	`bin` text DEFAULT '',
	`attributes` text DEFAULT '[]',
	`has_variants` integer DEFAULT false NOT NULL,
	`variants` text DEFAULT '{}',
	`supplier_name` text DEFAULT '',
	`supplier_code` text DEFAULT '',
	`lead_time` text DEFAULT '',
	`min_order` text DEFAULT '',
	`images` text DEFAULT '{}',
	`modules` text DEFAULT '{}',
	`mfg_date` text DEFAULT '',
	`warranty` text DEFAULT '',
	`expiry_tracking` integer DEFAULT false NOT NULL,
	`shelf_life` text DEFAULT '',
	`expiry_date` text DEFAULT '',
	`offer_enabled` integer DEFAULT false NOT NULL,
	`offer_type` text DEFAULT 'percent',
	`offer_value` real DEFAULT 0,
	`offer_label` text DEFAULT '',
	`description` text DEFAULT '',
	`notes` text DEFAULT '',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `option_values` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`value` text NOT NULL,
	`meta` text DEFAULT '{}',
	`sort` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `option_values_kind_value_unique` ON `option_values` (`kind`,`value`);