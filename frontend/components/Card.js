export default function Card({ children, className = "", ...props }) {
  return (
    <div className={`card-surface rounded-2xl p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
