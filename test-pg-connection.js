// Test raw pg connection
import "dotenv/config";
import { Pool } from "pg";

async function testConnection() {
  const connectionUrl = process.env.DATABASE_URL;
  console.log("Connection URL:", connectionUrl?.substring(0, 50) + "...");

  const pool = new Pool({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✓ Connected! Server time:", result.rows[0]);
  } catch (error) {
    console.error("Connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
