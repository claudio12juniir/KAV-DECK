import { useEffect, useRef } from "react";
import { useRealtime } from "../contexts/RealtimeContext.jsx";

// Refaz o fetch de uma página quando outro usuário da mesma empresa muda
// algo que ela mostra. `resource` é o path da rota REST que a página já usa
// pra carregar seus dados (ex.: "/vendas/pedidos"); o servidor casa por
// prefixo, então tanto a listagem quanto o detalhe (que também começa com
// esse path) recebem o evento.
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
