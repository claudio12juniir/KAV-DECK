import "./Button.css";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  ...rest
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
