import { createContext, useContext, useMemo, useState } from "react";

const TabsContext = createContext(null);

let proximoId = 1;

// Abas ficam só em memória de propósito (decisão da sessão) — cada uma tem
// seu próprio <MemoryRouter> (ver AppShell.jsx), então navegar dentro de
// uma aba (useNavigate, <Link>, redirecionar depois de salvar um formulário
// etc.) nunca afeta as outras nem a URL real do navegador. F5 sempre volta
// pra uma aba só, e é assim que tem que ser: não persistimos nada disso.
export function TabsProvider({ children, tabInicial }) {
  const [tabs, setTabs] = useState(() => [{ id: proximoId++, path: tabInicial.path, label: tabInicial.label }]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0].id);

  // Se já existe uma aba pro mesmo path, só foca nela em vez de abrir outra
  // igual — clicar duas vezes em "Produtos" no menu não deveria empilhar
  // abas repetidas.
  function openTab(path, label) {
    setTabs((atual) => {
      const existente = atual.find((t) => t.path === path);
      if (existente) {
        setActiveTabId(existente.id);
        return atual;
      }
      const novaAba = { id: proximoId++, path, label };
      setActiveTabId(novaAba.id);
      return [...atual, novaAba];
    });
  }

  // Nunca fecha a última aba — sempre precisa sobrar pelo menos uma pra
  // navegação continuar possível.
  function closeTab(id) {
    setTabs((atual) => {
      if (atual.length === 1) return atual;
      const index = atual.findIndex((t) => t.id === id);
      const restantes = atual.filter((t) => t.id !== id);
      setActiveTabId((atualActiveId) => {
        if (atualActiveId !== id) return atualActiveId;
        return restantes[Math.max(0, index - 1)].id;
      });
      return restantes;
    });
  }

  const value = useMemo(
    () => ({ tabs, activeTabId, openTab, closeTab, setActiveTabId }),
    [tabs, activeTabId],
  );

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("useTabs deve ser usado dentro de <TabsProvider>.");
  return context;
}
