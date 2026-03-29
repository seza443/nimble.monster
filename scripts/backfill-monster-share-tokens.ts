import { eq, isNull, or } from "drizzle-orm";
import { getDatabase } from "@/lib/db";
import * as schema from "@/lib/db/schema";

function generateShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

async function backfillMonsterShareTokens(options?: {
  batchSize?: number;
  maxBatches?: number;
}) {
  const batchSize = options?.batchSize ?? 250;
  const maxBatches = options?.maxBatches ?? Number.POSITIVE_INFINITY;

  const db = getDatabase();

  let batches = 0;
  let updatedTotal = 0;

  while (batches < maxBatches) {
    const rows = await db
      .select({ id: schema.monsters.id })
      .from(schema.monsters)
      .where(or(isNull(schema.monsters.shareToken), eq(schema.monsters.shareToken, "")))
      .limit(batchSize);

    if (rows.length === 0) break;

    for (const row of rows) {
      await db
        .update(schema.monsters)
        .set({ shareToken: generateShareToken() })
        .where(eq(schema.monsters.id, row.id));
      updatedTotal += 1;
    }

    batches += 1;
  }

  return { updatedTotal, batches };
}

// Intentionally not invoked automatically by the app/runtime.
// Run manually with: `pnpm tsx scripts/backfill-monster-share-tokens.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  backfillMonsterShareTokens()
    .then(({ updatedTotal, batches }) => {
      // eslint-disable-next-line no-console
      console.log(`Backfilled share tokens for ${updatedTotal} monsters in ${batches} batches.`);
      process.exit(0);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Backfill failed:", error);
      process.exit(1);
    });
}

