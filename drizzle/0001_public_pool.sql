ALTER TABLE cards ADD COLUMN lang TEXT NOT NULL DEFAULT 'zh' CHECK (lang IN ('zh','en'));
--> statement-breakpoint
ALTER TABLE cards ADD COLUMN listed INTEGER NOT NULL DEFAULT 0 CHECK (listed IN (0,1));
--> statement-breakpoint
CREATE INDEX cards_pool ON cards(lang,listed,deleted,created DESC);
