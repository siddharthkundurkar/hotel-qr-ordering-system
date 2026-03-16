// core/orderStateMachine.js

export const ORDER_STATES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "served",
  "paid",
];

/* 🔐 Role-Based State Machine */

const STATE_MACHINE = {
  KITCHEN: {
    pending: ["accepted"],
    accepted: ["preparing"],
    preparing: ["ready"],
  },

  WAITER: {
    ready: ["served"],
  },

  CASHIER: {
    served: ["paid"],
  },
};

/* ===============================
   Validate Transition
================================ */

export function canTransition(role, currentState, nextState) {
  const roleMachine = STATE_MACHINE[role];
  if (!roleMachine) return false;

  const allowed = roleMachine[currentState] || [];
  return allowed.includes(nextState);
}
