import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = (jwt) => {
    localStorage.setItem("token", jwt);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const getRoles = () => {
    if (!token) return [];

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.roles || [];
  };

  const isAdmin = () => getRoles().includes("ROLE_ADMIN");

  return (
    <AuthContext.Provider value={{ token, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);