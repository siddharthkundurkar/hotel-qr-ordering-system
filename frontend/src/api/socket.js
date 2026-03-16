import { io } from "socket.io-client";

export const socket = io("https://hotel-qr-ordering-system.onrender.com", {
  autoConnect: false,
});
