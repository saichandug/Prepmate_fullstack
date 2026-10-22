import { useCallback, useEffect, useState } from "react";
import AuthPage from "./components/AuthPage";
import LoadingState from "./components/LoadingState";
import Workspace from "./Workspace";
import { api } from "./utils/api";

export default function App() {
  // undefined = still checking the session, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    api.me().then(({ user }) => setUser(user)).catch(() => setUser(null));
  }, []);

  // Any API call that comes back 401 (expired session) sends the user back to the login page.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("prepmate:unauthorized", onUnauthorized);
    return () => window.removeEventListener("prepmate:unauthorized", onUnauthorized);
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    try { sessionStorage.removeItem("prepmate-active-section"); } catch {}
    setUser(null);
  }, []);

  if (user === undefined) {
    return <div className="boot-screen"><LoadingState message="Loading PrepMate..." /></div>;
  }
  if (!user) return <AuthPage onAuthenticated={setUser} />;

  // key makes sure a different account never sees the previous account's in-memory state
  return <Workspace key={user.id} user={user} onLogout={logout} />;
}
