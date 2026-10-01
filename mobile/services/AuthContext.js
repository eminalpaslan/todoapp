import { createContext, useContext, useEffect, useState } from 'react';

import { deleteToken, getToken, setToken } from './storage';

const AuthContext = createContext(null);

// Uygulama acilinca saklanan token var mi diye bakar; navigator bu bilgiye
// gore Login/Register mi yoksa TodoList mi gosterecegine karar verir.
export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then((token) => {
      setIsLoggedIn(token !== null);
      setIsLoading(false);
    });
  }, []);

  async function signIn(token) {
    await setToken(token);
    setIsLoggedIn(true);
  }

  async function signOut() {
    await deleteToken();
    setIsLoggedIn(false);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
