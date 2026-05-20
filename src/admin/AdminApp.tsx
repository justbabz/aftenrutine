import { useState } from "react";
import { AdminGate } from "./AdminGate";
import { AdminDashboard } from "./AdminDashboard";
import { clearPassword, getStoredPassword } from "./adminCloud";

export function AdminApp() {
  const [unlocked, setUnlocked] = useState(() => getStoredPassword().length > 0);

  if (!unlocked) {
    return <AdminGate onUnlock={() => setUnlocked(true)} />;
  }

  return <AdminDashboard onLock={() => {
    clearPassword();
    setUnlocked(false);
  }} />;
}
