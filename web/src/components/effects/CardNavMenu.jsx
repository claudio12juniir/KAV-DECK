import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { GoArrowUpRight } from "react-icons/go";
import { NavLink } from "react-router-dom";
import "./CardNavMenu.css";

const TONES = ["mono", "accent", "mono"];

export function CardNavMenu({ brand = "KAV DECK", groups, onNavigate, ease = "power3.out" }) {
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
          <span className="card-nav-spacer" aria-hidden="true" />
        </div>

        <div className="card-nav-content" aria-hidden={!isOpen}>
          {groups.map((group, idx) => (
            <div key={group.label} className={`nav-card nav-card-${TONES[idx % TONES.length]}`} ref={setCardRef(idx)}>
              <div className="nav-card-label">{group.label}</div>
              <div className="nav-card-links">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-card-link ${isActive ? "active" : ""}`}
                    onClick={() => {
                      toggleMenu();
                      onNavigate?.();
                    }}
                  >
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
