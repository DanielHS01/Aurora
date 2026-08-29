'use client';

import { useEffect, useState } from 'react';
import type { MaintenanceAnnouncement } from '@/lib/queries/platformAdmin';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Formateo manual en vez de toLocaleString: Node y el navegador usan
// implementaciones de Intl distintas y pueden producir textos diferentes
// para las mismas opciones (ej. "24 de agosto, 01:02 p. m." en el servidor
// vs "24 de agosto a las 01:02 p. m." en el cliente), lo que rompe la
// hidratación de SSR. Con un formateador propio, el resultado es idéntico
// sin importar dónde se ejecute.
function formatAnnouncementDate(dateStr: string, timeStr: string): string {
  const d = new Date(`${dateStr}T${timeStr}`);
  const day = d.getDate();
  const month = MESES[d.getMonth()];

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
  hours = hours % 12 || 12;

  return `${day} de ${month}, ${hours}:${minutes} ${ampm}`;
}

export default function MaintenanceBanner({
  announcement,
}: {
  announcement: MaintenanceAnnouncement | null;
}) {
  // El chequeo de "¿ya pasó la ventana de mantenimiento?" depende de Date.now(),
  // que es impuro. Lo sacamos del render y lo movemos a un efecto + estado,
  // así el render en sí queda determinístico.
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!announcement) return;

    const scheduledDateTime = new Date(
      `${announcement.scheduled_date}T${announcement.scheduled_time}`
    );
    const endTime = new Date(
      scheduledDateTime.getTime() + announcement.duration_minutes * 60000
    );

    const check = () => setIsExpired(Date.now() > endTime.getTime());

    check(); // chequeo inicial al montar
    const interval = setInterval(check, 30_000); // revisa cada 30s por si sigue montado
    return () => clearInterval(interval);
  }, [announcement]);

  if (!announcement || isExpired) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-800">
      🛠️ Mantenimiento programado:{' '}
      {formatAnnouncementDate(announcement.scheduled_date, announcement.scheduled_time)} —
      duración estimada {announcement.duration_minutes} min.
      {announcement.extra_message && ` ${announcement.extra_message}`}
    </div>
  );
}