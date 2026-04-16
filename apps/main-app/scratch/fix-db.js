const { Pool } = require('pg');

// Neon Connection string
const connectionString = "postgresql://neondb_owner:npg_Zw1YFif3WBce@ep-icy-forest-a1api6v3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString,
});

async function migrate() {
  console.log("Starting manual database repair...");
  
  const client = await pool.connect();
  try {
    console.log("Adding 'role' column...");
    await client.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;`);
    
    console.log("Adding 'banned' column...");
    await client.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false NOT NULL;`);
    
    console.log("Adding 'ban_reason' column...");
    await client.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" text;`);
    
    console.log("Adding 'ban_expires' column...");
    await client.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp;`);
    
    console.log("Relaxing 'name' column...");
    await client.query(`ALTER TABLE "user" ALTER COLUMN "name" DROP NOT NULL;`);

    console.log("Ensuring timestamps have defaults...");
    await client.query(`ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT now();`);
    await client.query(`ALTER TABLE "user" ALTER COLUMN "updated_at" SET DEFAULT now();`);
    await client.query(`ALTER TABLE "account" ALTER COLUMN "created_at" SET DEFAULT now();`);
    await client.query(`ALTER TABLE "account" ALTER COLUMN "updated_at" SET DEFAULT now();`);
    
    console.log("Adding account unique index...");
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "account_provider_id_account_id_idx" ON "account" ("provider_id","account_id");`);

    console.log("Repair complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
