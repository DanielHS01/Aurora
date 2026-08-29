'use client'

import { useEffect, useState } from 'react';

export default function MaintenanceCountdown({ endTime }: { endTime: string }) {
  const [remainingMs, setRemainingMs] = useState(
    () => new Date(endTime).getTime() - Date.now()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(new Date(endTime).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (remainingMs <= 0) {
    return (
      <p className="mt-6 text-sm font-medium text-emerald-600">
        El mantenimiento debería haber terminado — intenta recargar la página.
      </p>
    );
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs uppercase tracking-widest text-black/40">
        Tiempo estimado restante
      </p>
      <div className="font-mono text-3xl font-semibold tracking-tight">
        {hours > 0 && `${String(hours).padStart(2, '0')}:`}
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}