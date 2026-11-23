CREATE TABLE cards (id TEXT PRIMARY KEY NOT NULL, prompt_id TEXT NOT NULL, answer TEXT NOT NULL, source TEXT NOT NULL CHECK(source IN ('human','ai')), owner TEXT NOT NULL, manage_hash TEXT NOT NULL, created INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE INDEX cards_owner_recent ON cards(owner, created);
--> statement-breakpoint
CREATE TABLE votes (card_id TEXT NOT NULL, visitor TEXT NOT NULL, choice TEXT NOT NULL CHECK(choice IN ('human','ai')), PRIMARY KEY(card_id, visitor));
--> statement-breakpoint
CREATE INDEX votes_by_visitor ON votes(visitor,card_id);
--> statement-breakpoint
CREATE TABLE reports (card_id TEXT NOT NULL, visitor TEXT NOT NULL, reason TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(card_id, visitor));
