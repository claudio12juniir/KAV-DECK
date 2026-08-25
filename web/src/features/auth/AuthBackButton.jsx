import { ArrowLeft } from "lucide-react";

export function AuthBackButton({ onClick, label = "Voltar" }) {
  return (
    <button type="button" className="login-back" onClick={onClick} aria-label={label} title={label}>
      <ArrowLeft size={20} aria-hidden="true" />
    </button>
  );
}
