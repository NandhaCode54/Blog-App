import { createContext, useState } from 'react';
export const AuthCtx = createContext();
export default function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const login = t => { setToken(t); localStorage.setItem('token', t); };
  const logout = () => { setToken(null); localStorage.removeItem('token'); };
  return <AuthCtx.Provider value={{ token, login, logout }}>{children}</AuthCtx.Provider>;
}
