import { forwardRef } from "react";
import "./Field.css";

let idCounter = 0;

// forwardRef existe só pra deixar campos encadeáveis por teclado (ex.: o
// loop Qtd → Produto → Valor → Desconto → Observação → Adicionar do
// Terminal de Venda, que chama .focus() no próximo campo a cada Enter) —
// sem isso, um <Input ref={...}> simplesmente não recebe o ref do React.
export const Input = forwardRef(function Input({ label, error, hint, id, ...rest }, ref) {
  const inputId = id ?? `input-${++idCounter}`;

  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {label && (
        <label className="field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input ref={ref} id={inputId} className="field-control" {...rest} />
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </div>
  );
});
