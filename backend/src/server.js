import http from "node:http";   // better for Node ESM
import { Server } from "socket.io";
import app from "./app.js";
import { runSlaJob } from "./jobs/slaJob.js";
import { runTableGuard } from "./jobs/tableGuard.job.js";

const server = http.createServer(app);

/* =====================================
   SOCKET.IO (PRODUCTION READY)
===================================== */

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },

  /* restaurant network stability */
  pingTimeout: 60000,
  pingInterval: 25000,

  /* scaling support */
  transports: ["websocket", "polling"],
});

/* STORE IO ON APP */
app.set("io", io);

/* =====================================
   SOCKET CONNECTION
===================================== */

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  /* JOIN BRANCH (staff dashboards) */
  socket.on("join:branch", (branchId) => {
    if (!branchId) return;

    const room = `branch:${branchId}`;

    if (!socket.rooms.has(room)) {
      socket.join(room);
      console.log(`🏢 ${socket.id} joined ${room}`);
    }
  });

  /* JOIN ORDER (customer tracking) */
  socket.on("join:order", (payload) => {
    if (!payload) return;

    const orderId =
      typeof payload === "object" ? payload.orderId : payload;

    if (!orderId) return;

    const cleanId = String(orderId).replace("order:", "");
    const room = `order:${cleanId}`;

    /* leave previous order rooms */
    socket.rooms.forEach((r) => {
      if (r.startsWith("order:") && r !== room) {
        socket.leave(r);
      }
    });

    socket.join(room);
    console.log(`📦 ${socket.id} joined ${room}`);
  });

  /* DEBUG */
  socket.on("ping:test", () => {
    socket.emit("pong:test", { ok: true });
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔴 Socket disconnected: ${socket.id} | ${reason}`);
  });
});

/* =====================================
   SERVER START
===================================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  /* TABLE GUARD */
  if (!global.__TABLE_GUARD_STARTED__) {
    global.__TABLE_GUARD_STARTED__ = true;

    setInterval(() => {
      runTableGuard(io);
    }, 3 * 60 * 1000);

    console.log("🛡️ Table Guard started (every 3 minutes)");
  }

  /* SLA JOB */
  if (!global.__SLA_JOB_STARTED__) {
    global.__SLA_JOB_STARTED__ = true;

    setInterval(() => {
      runSlaJob(io);
    }, 2 * 60 * 1000);

    console.log("⏱️ SLA job started (every 2 minutes)");
  }
});