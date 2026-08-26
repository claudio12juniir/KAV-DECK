import { useEffect, useRef } from "react";
import { useRealtime } from "../contexts/RealtimeContext.jsx";

// Refaz o fetch de uma tela quando outro usuário da mesma empresa muda algo
// que ela mostra. `resource` é o path da rota REST que a tela já usa pra
// carregar seus dados (ex.: "/vendas/pedidos"); o servidor casa por
// prefixo. Mesmo desenho do app web (web/src/hooks/useRealtimeInvalidate.js).
export function useRealtimeInvalidate(resource, refetch) {
  const { subscribeInvalidate } = useRealtime();
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!resource) return undefined;
    return subscribeInvalidate((payload) => {
      if (payload.resource.startsWith(resource)) {
        refetchRef.current();
      }
    });
  }, [resource, subscribeInvalidate]);
}
