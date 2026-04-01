CREATE TABLE `connected_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exchange` enum('coinbase','kraken') NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`encryptedApiKey` text NOT NULL,
	`encryptedApiSecret` text NOT NULL,
	`lastSyncedAt` timestamp,
	`syncStatus` enum('pending','syncing','success','error') NOT NULL DEFAULT 'pending',
	`syncError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connected_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`userId` int NOT NULL,
	`description` text,
	`category` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int NOT NULL,
	`exchange` enum('coinbase','kraken') NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`transactionType` varchar(100) NOT NULL,
	`status` varchar(100) NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`currency` varchar(10) NOT NULL,
	`nativeAmount` decimal(20,2),
	`nativeCurrency` varchar(10),
	`fee` decimal(20,8),
	`feeCurrency` varchar(10),
	`counterparty` text,
	`transactionDate` timestamp NOT NULL,
	`rawData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `connected_accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `ann_tx_id_idx` ON `transaction_annotations` (`transactionId`);--> statement-breakpoint
CREATE INDEX `ann_user_id_idx` ON `transaction_annotations` (`userId`);--> statement-breakpoint
CREATE INDEX `tx_user_id_idx` ON `transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `tx_account_id_idx` ON `transactions` (`accountId`);--> statement-breakpoint
CREATE INDEX `tx_external_id_idx` ON `transactions` (`externalId`);--> statement-breakpoint
CREATE INDEX `tx_date_idx` ON `transactions` (`transactionDate`);