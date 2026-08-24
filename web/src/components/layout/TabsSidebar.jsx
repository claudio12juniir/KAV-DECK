import { FiPlus, FiX } from "react-icons/fi";
import { useTabs } from "../../contexts/TabsContext.jsx";
import "./TabsSidebar.css";

// Lista vertical das abas abertas, fixa na lateral esquerda — cada aba tem
// seu próprio <MemoryRouter> montado em AppShell.jsx, então trocar de aba
// aqui não recarrega nada, só troca qual delas está visível.
export function TabsSidebar() {
  const { tabs, activeTabId, setActiveTabId, closeTab, openTab } = useTabs();

  return (
    <aside className="tabs-sidebar">
      <ul className="tabs-sidebar-list">
        {tabs.map((tab) => (
          <li key={tab.id}>
            <button
              type="button"
              className={`tabs-sidebar-tab ${tab.id === activeTabId ? "is-active" : ""}`}
              onClick={() => setActiveTabId(tab.id)}
              title={tab.label}
            >
              <span className="tabs-sidebar-tab-label">{tab.label}</span>
              {tabs.length > 1 && (
                <span
                  role="button"
                  tabIndex={0}
                  className="tabs-sidebar-tab-close"
                  aria-label={`Fechar aba ${tab.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      closeTab(tab.id);
                    }
                  }}
                >
                  <FiX />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="tabs-sidebar-nova"
        onClick={() => openTab("/", "Início")}
        aria-label="Abrir nova aba"
        title="Nova aba"
      >
        <FiPlus />
      </button>
    </aside>
  );
}
