import { useEffect, useState } from "react";
import "./DigitalClock.css";

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function diaDoAno(data) {
  const inicio = new Date(data.getFullYear(), 0, 0);
  const diff = data - inicio;
  return Math.floor(diff / 86400000);
}

function diasNoAno(ano) {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0 ? 366 : 365;
}

let TIMEZONE = "";
try {
  TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
} catch {
  TIMEZONE = "";
}

export function DigitalClock() {
  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dataExtenso = `${DIAS[agora.getDay()]}, ${agora.getDate()} de ${MESES[agora.getMonth()]}`;
  const segundosNoDia = agora.getHours() * 3600 + agora.getMinutes() * 60 + agora.getSeconds();
  const progressoDia = (segundosNoDia / 86400) * 100;
  const diaAtual = diaDoAno(agora);
  const totalDias = diasNoAno(agora.getFullYear());

  return (
    <div className="time-panel">
      <div className="time-panel-glow" aria-hidden="true" />
      <div className="time-panel-grid" aria-hidden="true" />

      <div className="time-panel-top">
        <span className="time-panel-live">
          <span className="time-panel-live-dot" />
          Ao vivo
        </span>
        {TIMEZONE && <span className="time-panel-tz">{TIMEZONE}</span>}
      </div>

      <div className="time-panel-clock">
        <span className="time-panel-clock-h">{pad(agora.getHours())}</span>
        <span className="time-panel-colon">:</span>
        <span className="time-panel-clock-h">{pad(agora.getMinutes())}</span>
        <span className="time-panel-sec">
          <span className="time-panel-colon">:</span>
          {pad(agora.getSeconds())}
        </span>
      </div>

      <div className="time-panel-bottom">
        <div className="time-panel-date">
          <span className="time-panel-date-day">{dataExtenso}</span>
          <span className="time-panel-date-year">{agora.getFullYear()}</span>
        </div>

        <div className="time-panel-progress">
          <div className="time-panel-progress-track">
            <div className="time-panel-progress-fill" style={{ width: `${progressoDia}%` }} />
          </div>
          <div className="time-panel-progress-label">
            <span>Dia {diaAtual} de {totalDias}</span>
            <span>{progressoDia.toFixed(0)}% do dia</span>
          </div>
        </div>
      </div>
    </div>
  );
}
