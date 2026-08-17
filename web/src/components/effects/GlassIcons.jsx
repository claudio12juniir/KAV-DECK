import { Link } from "react-router-dom";
import "./GlassIcons.css";

const TONES = {
  mono: "linear-gradient(160deg, rgba(255,255,255,0.5), rgba(255,255,255,0.06))",
  accent: "linear-gradient(160deg, rgba(64,223,232,0.75), rgba(64,223,232,0.25))",
};

export function GlassIcons({ items, className = "" }) {
  function backgroundFor(tone) {
    return { background: TONES[tone] ?? TONES.mono };
  }

  return (
    <div className={`glass-icon-grid ${className}`}>
      {items.map((item, index) => {
        const Tag = item.to ? Link : "button";
        return (
          <Tag
            key={item.label ?? index}
            to={item.to}
            type={item.to ? undefined : "button"}
            className={`glass-icon-btn ${item.tone === "accent" ? "is-accent" : ""}`}
            aria-label={item.label}
          >
            <span className="glass-icon-btn__back" style={backgroundFor(item.tone)} />
            <span className="glass-icon-btn__front">
              <span className="glass-icon-btn__icon" aria-hidden="true">
                {item.icon}
              </span>
            </span>
            <span className="glass-icon-btn__label">{item.label}</span>
          </Tag>
        );
      })}
    </div>
  );
}
