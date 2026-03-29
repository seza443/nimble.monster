ALTER TABLE `monsters` ADD `share_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `monsters_share_token_unique` ON `monsters` (`share_token`);