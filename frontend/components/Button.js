const baseStyles =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition";

const variants = {
  primary: "bg-emerald-600 text-white shadow-soft hover:bg-emerald-700",
  secondary: "bg-white/70 text-slate-700 hover:bg-white border border-white/70",
  ghost: "text-emerald-700 hover:bg-emerald-50",
};

export default function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
}
