import { db } from "./src/drizzle/db";
import { 
  apiEndpoints, 
  apiTags, 
  apiQueryParams, 
  apiRequestBodies, 
  apiUpstreamHeaders, 
  apiCalls, 
  apiReviews, 
  favorites 
} from "./src/drizzle/schema";
import { notInArray, eq, sql } from "drizzle-orm";

async function main() {
  console.log("Starting database cleanup...");

  // Get all valid endpoint IDs
  const validEndpoints = await db.select({ id: apiEndpoints.id }).from(apiEndpoints);
  const validIds = validEndpoints.map(e => e.id);

  if (validIds.length === 0) {
    console.log("No endpoints found. Cleaning everything...");
    // If no endpoints, all children are orphans
    await db.delete(apiTags);
    await db.delete(apiQueryParams);
    await db.delete(apiRequestBodies);
    await db.delete(apiUpstreamHeaders);
    await db.delete(apiCalls);
    await db.delete(apiReviews);
    await db.delete(favorites);
  } else {
    // Delete orphans
    const deleteOrphans = async (table: any, name: string) => {
        const result = await db.delete(table).where(
            sql`${table.apiEndpointId} NOT IN (${validIds.join(',')})`
        );
        console.log(`Cleaned ${name}`);
    };

    // Note: sql template strings are safer, or just use a more direct approach
    // Drizzle's notInArray might be limited by large arrays, but we'll try
    
    const tables = [
        { table: apiTags, name: "apiTags" },
        { table: apiQueryParams, name: "apiQueryParams" },
        { table: apiRequestBodies, name: "apiRequestBodies" },
        { table: apiUpstreamHeaders, name: "apiUpstreamHeaders" },
        { table: apiCalls, name: "apiCalls" },
        { table: apiReviews, name: "apiReviews" },
        { table: favorites, name: "favorites" },
    ];

    for (const { table, name } of tables) {
        try {
            await db.delete(table).where(notInArray(table.apiEndpointId, validIds));
            console.log(`Cleaned orphans from ${name}`);
        } catch (e) {
            console.error(`Error cleaning ${name}:`, e);
        }
    }
  }

  console.log("Cleanup complete!");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
