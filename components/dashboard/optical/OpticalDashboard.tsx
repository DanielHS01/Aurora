export default function OpticalDashboard({
  businessId,
}: {
  businessId: string;
}) {
  return (
    <div className="p-10 text-center text-black/40">
      <h1 className="text-2xl font-semibold text-black mb-2">
        Panel de Óptica
      </h1>
      <p>Próximamente — citas, inventario de lentes y exámenes visuales.</p>
    </div>
  );
}