import mysql from "mysql2/promise";
import { env } from "./env.js";

export const db = mysql.createPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  port: env.db.port,
  waitForConnections: true,
  connectionLimit: 10,
});

export const connectDB = async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ Database connected");
    connection.release();
  } catch (err) {
    console.error("❌ DB connection failed", err.message);
    process.exit(1);
  }
};
