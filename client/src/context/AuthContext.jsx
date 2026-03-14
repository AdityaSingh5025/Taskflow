import { createContext, useContext, useState, useEffect } from "react";
import api, { setTokenGetter, setUnauthHandler } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // Wire up the axios interceptors to read/clear state without circular imports
  useEffect(() => {
    setTokenGetter(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    setUnauthHandler(() => {
      setUser(null);
      setAccessToken(null);
    });
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout"); // clears HttpOnly cookie on server
    } catch (_) { }
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
