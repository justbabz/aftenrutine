import { useState } from "react";
import { AdminGate } from "./AdminGate";
import { AdminDashboard } from "./AdminDashboard";

const UNLOCK_KEY = "familierutine-admin-unlocked";

export function AdminApp() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === "1");

  if (!unlocked) {
    return <AdminGate onUnlock={() => {
      sessionStorage.setItem(UNLOCK_KEY, "1");
      setUnlocked(true);
    }} />;
  }

  return <AdminDashboard onLock={() => {
    sessionStorage.removeItem(UNLOCK_KEY);
    setUnlocked(false);
  }} />;
}
