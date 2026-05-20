import { AppProvider, useApp } from "./state/AppContext";
import { SetupWizard } from "./components/SetupWizard";
import { AdminAuth } from "./components/AdminAuth";
import { ProfilePicker } from "./components/ProfilePicker";
import { RoutineView } from "./components/RoutineView";
import { AdminScreen } from "./components/AdminScreen";
import { ProfileEditor } from "./components/ProfileEditor";
import { RoutineEditor } from "./components/RoutineEditor";
import { TaskEditor } from "./components/TaskEditor";
import { ToastHost } from "./components/ToastHost";
import { UpdatePrompt } from "./components/UpdatePrompt";

function Router() {
  const { screen } = useApp();
  switch (screen.kind) {
    case "setup-wizard":
      return <SetupWizard />;
    case "admin-auth":
      return <AdminAuth />;
    case "picker":
      return <ProfilePicker />;
    case "routine":
      return <RoutineView profileId={screen.profileId} slot={screen.slot} />;
    case "admin-home":
      return <AdminScreen />;
    case "admin-profile":
      return <ProfileEditor profileId={screen.profileId as string} />;
    case "admin-routine":
      return <RoutineEditor profileId={screen.profileId} slot={screen.slot} />;
    case "admin-task":
      return <TaskEditor profileId={screen.profileId} slot={screen.slot} taskId={screen.taskId} />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
      <ToastHost />
      <UpdatePrompt />
    </AppProvider>
  );
}
