import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import branchTestRoutes from "./routes/branchTest.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import tableRoutes from "./routes/table.routes.js";
import publicRoutes from "./routes/public.routes.js";
import kitchenRoutes from "./routes/kitchen.routes.js";
import cashierRoutes from "./routes/cashier.routes.js";
import reportRoutes from "./routes/report.routes.js";
import waiterRoutes from "./routes/waiter.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import queueRoutes from "./routes/queue.routes.js";
import taxRoutes from "./routes/tax.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import categoryRoutes from "./routes/menuCategory.routes.js";
import menuRoutes from "./routes/menuItem.routes.js";
import managerRoutes from "./routes/manager.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import orderHistoryRoutes from "./routes/order.history.routes.js";
import staffattendanceRoutes from "./routes/staffattendance.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import platformRoutes from "./routes/platform.routes.js";
import ownerReportRoutes from "./routes/ownerReport.routes.js";
const app = express();

/* ================= PATH FIX (ESM) ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
/* ================= CORS ================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
  "https://hotel-qr-ordering-system.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {

      // allow requests with no origin (Postman, mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS BLOCKED:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

/* ================= TEST ================= */
app.get("/test", (req, res) => {
  res.json({ message: "App is working" });
});

/* ================= API ROUTES ================= */
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/branches", branchRoutes);
app.use("/branch-test", branchTestRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/cashier", cashierRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/waiter", waiterRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendance", staffattendanceRoutes);
app.use("/api/platform", platformRoutes); // new platform routes
app.use("/api/owner-reports", ownerReportRoutes); // new owner report routes
/* Unified history */
app.use("/api", orderHistoryRoutes);
app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl);
  next();
});
/* ================= STATIC FILES ================= */

// uploads folder
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// serve frontend build
app.use(express.static(path.join(__dirname, "../../frontend/dist")));
/* ================= REACT ROUTING FIX ================= */
app.get("*", (req, res, next) => {

  // allow API routes
  if (req.originalUrl.startsWith("/api")) {
    return next();
  }

  // allow uploaded files
  if (req.originalUrl.startsWith("/uploads")) {
    return next();
  }

  res.sendFile(
    path.join(__dirname, "../../frontend/dist/index.html")
  );
});
/* ================= ERROR HANDLER ================= */
app.use(errorHandler);

export default app;
