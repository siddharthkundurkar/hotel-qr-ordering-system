import cron from "node-cron";
import { db } from "../config/db.js";

export const startRefreshTokenCleanup = () => {
  // Runs every day at 3 AM
  cron.schedule("0 3 * * *", async () => {
    try {
      const [result] = await db.query(
        "DELETE FROM refresh_tokens WHERE expiresAt < NOW()"
      );
      console.log(
        `🧹 Refresh token cleanup: ${result.affectedRows} removed`
      );
    } catch (err) {
      console.error("❌ Refresh token cleanup failed:", err);
    }
  });
};
