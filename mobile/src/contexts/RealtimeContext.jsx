import { createContext, useContext, useEffect, useRef, useState } from "react";
import { connectSocket, disconnectSocket } from "../lib/socketClient.js";
import { useAuth } from "./AuthContext.jsx";

const RealtimeContext = createContext(null);

// Conecta o socket enquanto há sessão e o desconecta no logout. Telas não
// escutam o socket diretamente — assinam invalidação por recurso via
// useRealtimeInvalidate (src/hooks/useRealtimeInvalidate.js), que usa
// subscribeInvalidate exposto aqui. Mesmo desenho do app web
// (web/src/contexts/RealtimeContext.jsx).
export function RealtimeProvider({ children }) {
  const { session, encerrarSessaoLocal } = useAuth();
  const temSessao = Boolean(session);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Set());

  useEffect(() => {
    if (!temSessao) {
      disconnectSocket();
      setConnected(false);
      return undefined;
    }

    const socket = connectSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onInvalidate = (payload) => {
      listenersRef.current.forEach((listener) => listener(payload));
    };
    // Aviso imediato de "você entrou em outro dispositivo" ou "um admin
    // encerrou sua sessão" — não precisa esperar a próxima requisição HTTP
    // tomar 401 SESSION_REVOKED.
    const onSessionRevoked = (payload) => encerrarSessaoLocal(payload?.motivo);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("invalidate", onInvalidate);
    socket.on("session-revoked", onSessionRevoked);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("invalidate", onInvalidate);
      socket.off("session-revoked", onSessionRevoked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temSessao]);

  function subscribeInvalidate(listener) {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }

  return (
    <RealtimeContext.Provider value={{ connected, subscribeInvalidate }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime deve ser usado dentro de <RealtimeProvider>.");
  return context;
}
