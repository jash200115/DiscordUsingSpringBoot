// FULL updated AuthContext.jsx

import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

/**
 * INTERVIEW CONCEPT — JWT Decoding on the Frontend:
 * A JWT is: base64(header) . base64(payload) . signature
 * The payload is NOT encrypted — just Base64 encoded.
 * So we can decode it client-side using atob() to read claims
 * like username, roles, expiry — WITHOUT calling the server.
 *
 * This is intentional by design: JWTs are "self-contained tokens".
 * The server embeds data at sign-time; clients can read (not forge) it.
 */
const decodeToken = (jwt) => {
  if (!jwt) return {};
  try {
    return JSON.parse(atob(jwt.split(".")[1]));
  } catch {
    return {};
  }
};

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

  // Derived from token — no extra state needed
  const payload = decodeToken(token);
  const username = payload.username || "";
  const getRoles = () => payload.roles || [];
  const isAdmin = () => getRoles().includes("ROLE_ADMIN");

  return (
    /**
     * INTERVIEW CONCEPT — React Context as a Service Locator:
     * We expose `username` here so ANY component in the tree can
     * call useAuth() and get the logged-in user's name — without
     * prop drilling or re-fetching from the server.
     */
    <AuthContext.Provider value={{ token, login, logout, isAdmin, username }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);