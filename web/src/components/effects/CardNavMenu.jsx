import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { GoArrowUpRight } from "react-icons/go";
import "./CardNavMenu.css";

const TONES = ["mono", "accent", "mono"];

export function CardNavMenu({ brand = "KAV DECK", groups, onNavegar, onSignOut, ease = "power3.out" }) {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 320;
    const contentEl = navEl.querySelector(".card-nav-content");
    if (!contentEl) return 320;

    const was = {
      visibility: contentEl.style.visibility,
      pointerEvents: contentEl.style.pointerEvents,
      position: contentEl.style.position,
      height: contentEl.style.height,
    };
    Object.assign(contentEl.style, { visibility: "visible", pointerEvents: "auto", position: "static", height: "auto" });
    contentEl.offsetHeight;
    const contentHeight = contentEl.scrollHeight;
    Object.assign(contentEl.style, was);

    return 56 + contentHeight + 16;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 56, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 24, opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.45, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.07 }, "-=0.15");
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    // Se `groups` mudar com o menu já aberto (ex.: papel do usuário mudou
    // no meio da sessão), reabre instantaneamente na altura nova em vez de
    // deixar a timeline recém-criada no estado fechado — sem isso o menu
    // pareceria ter fechado sozinho.
    if (isOpen) tl?.progress(1);
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isOpen) {
      setIsOpen(true);
      tl.play(0);
    } else {
      tl.eventCallback("onReverseComplete", () => setIsOpen(false));
      tl.reverse();
    }
  };

  const setCardRef = (i) => (el) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className="card-nav-container">
      <nav ref={navRef} className={`card-nav ${isOpen ? "open" : ""}`}>
        <div className="card-nav-top">
          <button
            type="button"
            className={`card-nav-hamburger ${isOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isOpen}
          >
            <span />
            <span />
          </button>
          <div className="card-nav-brand">{brand}</div>
          {onSignOut ? (
            <button type="button" className="card-nav-sair" onClick={onSignOut}>
              Sair
            </button>
          ) : (
            <span className="card-nav-spacer" aria-hidden="true" />
          )}
        </div>

        <div className="card-nav-content" aria-hidden={!isOpen}>
          {groups.map((group, idx) => (
            <div key={group.label} className={`nav-card nav-card-${TONES[idx % TONES.length]}`} ref={setCardRef(idx)}>
              <div className="nav-card-label">{group.label}</div>
              <div className="nav-card-links">
                {group.items.map((item) => (
                  <button
                    type="button"
                    key={item.to}
                    className="nav-card-link"
                    onClick={() => {
                      toggleMenu();
                      onNavegar?.(item.to);
                    }}
                  >
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
