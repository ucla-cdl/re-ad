import { createContext, useEffect, useState } from "react";

export interface UserContextData {
  userId: string;
  setUserId: (id: string) => void;
}

export const UserContext = createContext<UserContextData | null>(null);

export const UserContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserIdState] = useState<string>("unknown");

  useEffect(() => {
    // Always ask the user for a username on every page load / refresh
    let newId = window.prompt("Please enter a username to use this platform:") || "";
    if (!newId.trim()) {
      newId = `user-${Math.random().toString(36).substring(2, 8)}`;
    }
    setUserIdState(newId);
  }, []);

  const setUserId = (id: string) => {
    setUserIdState(id);
  };

  return (
    <UserContext.Provider value={{ userId, setUserId }}>{children}</UserContext.Provider>
  );
}; 