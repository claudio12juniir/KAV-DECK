import "./Field.css";

let idCounter = 0;

export function Input({ label, error, hint, id, ...rest }) {
  const inputId = id ?? `input-${++idCounter}`;

  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {label && (
        <label className="field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className="field-control" {...rest} />
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
