import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

/* 🔌 Connected */
socket.on("connect", () => {
  console.log("🟢 SOCKET CONNECTED:", socket.id);

  const orderId = sessionStorage.getItem("orderId");
  if (orderId) {
    socket.emit("join:order", orderId);
  }
});

/* 🔌 Disconnected */
socket.on("disconnect", () => {
  console.log("🔴 SOCKET DISCONNECTED");
});

export default socket;
