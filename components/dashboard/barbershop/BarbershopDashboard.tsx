export default function BarbershopDashboard({
  businessId,
}: {
  businessId: string;
}) {
  return (
    <div className="p-10 text-center text-black/40">
      <h1 className="text-2xl font-semibold text-black mb-2">
        Panel de Barbería
      </h1>
      <p>Próximamente — agenda de citas, servicios y barberos.</p>
    </div>
  );
}