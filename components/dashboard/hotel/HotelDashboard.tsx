export default function HotelDashboard({
  businessId,
}: {
  businessId: string;
}) {
  return (
    <div className="p-10 text-center text-black/40">
      <h1 className="text-2xl font-semibold text-black mb-2">
        Panel de Hotel
      </h1>
      <p>Próximamente — reservas, habitaciones y check-in/check-out.</p>
    </div>
  );
}