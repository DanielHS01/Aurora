export default function StatCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-black/40">{title}</p>
      <h3 className="mt-2 text-2xl font-medium tracking-tight">{value}</h3>
    </div>
  );
}