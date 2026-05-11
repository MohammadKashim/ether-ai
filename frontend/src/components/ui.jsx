export function Button({ className = "", variant = "primary", ...props }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 border-blue-600",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200",
    dark: "bg-slate-900 text-white hover:bg-slate-800 border-slate-900",
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ className = "", ...props }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`} {...props} />;
}

export function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-slate-600">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${tones[tone]}`}>{children}</span>;
}
