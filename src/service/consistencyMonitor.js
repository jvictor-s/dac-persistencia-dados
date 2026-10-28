import { listConsistentUsers } from "./userService.js";

let timer;
let lastState;

export function startConsistencyMonitor(intervalMs = 10) {
  if (timer) return;
  timer = setInterval(async () => {
    try {
      const users = await listConsistentUsers();
      lastState = {
        checkedAt: new Date().toISOString(),
        users,
        consistent: users.every((user) => user.consistent),
      };
    } catch (error) {
      console.error("Erro no monitor de consistência:", error.message);
    }
  }, intervalMs);
}

export function getConsistencyState() {
  return lastState || { checkedAt: null, users: [], consistent: true };
}

export function stopConsistencyMonitor() {
  if (timer) clearInterval(timer);
  timer = undefined;
}
