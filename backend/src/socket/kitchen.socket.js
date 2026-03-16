export default function registerKitchenSocket(io) {
  io.on("connection", (socket) => {
    console.log("🍳 Kitchen connected:", socket.id);

    // Join kitchen room (branch-wise later)
    socket.on("join-kitchen", ({ branchId }) => {
      socket.join(`kitchen-${branchId}`);
      console.log(`🍳 Joined kitchen-${branchId}`);
    });

    socket.on("disconnect", () => {
      console.log("❌ Kitchen disconnected:", socket.id);
    });
  });
}
