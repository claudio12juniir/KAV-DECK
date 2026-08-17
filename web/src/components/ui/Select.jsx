import "./Field.css";

let idCounter = 0;

export function Select({ label, error, hint, id, children, ...rest }) {
  const selectId = id ?? `select-${++idCounter}`;

  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {label && (
        <label className="field-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select id={selectId} className="field-control" {...rest}>
        {children}
      </select>
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}
