import { createAdminClient } from "@/lib/supabase/admin";
import { isAnnouncementVisible } from "@/lib/utils/maintenanceWindow";
import { daysBetweenColombiaDates } from "@/lib/utils/subscriptionDates";

export type BusinessOverview = {
  id: string;
  name: string;
  business_type: string | null;
  is_active: boolean | null;
  created_at: string | null;
  subscriptionStatus: string | null;
  lockState: "ok" | "grace" | "locked" | null;
  daysInfo: string;
};

export async function getAllBusinessesOverview(): Promise<BusinessOverview[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, business_type, is_active, created_at, subscriptions(status, current_period_end)",
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((b) => {
    const sub = Array.isArray(b.subscriptions)
      ? b.subscriptions[0]
      : b.subscriptions;

    let lockState: "ok" | "grace" | "locked" | null = null;
    let daysInfo = "—";

    if (sub?.current_period_end) {
      const diffDays = daysBetweenColombiaDates(
        new Date().toISOString(),
        sub.current_period_end,
      );
      const graceLimit = sub.status === "trial" ? 0 : 3;

      if (diffDays >= 0) {
        lockState = "ok";
        daysInfo = `En ${diffDays} día(s)`;
      } else if (Math.abs(diffDays) <= graceLimit) {
        lockState = "grace";
        daysInfo = `En gracia (${graceLimit - Math.abs(diffDays)} día(s) restantes)`;
      } else {
        lockState = "locked";
        daysInfo = `Bloqueado hace ${Math.abs(diffDays) - graceLimit} día(s)`;
      }
    }

    return {
      id: b.id,
      name: b.name,
      business_type: b.business_type,
      is_active: b.is_active,
      created_at: b.created_at,
      subscriptionStatus: sub?.status ?? null,
      lockState,
      daysInfo,
    };
  });
}

// ============================================================
// Mantenimiento
// ============================================================

export type MaintenanceAnnouncement = {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  extra_message: string | null;
  is_active: boolean;
};

export async function getActiveMaintenanceAnnouncement(): Promise<MaintenanceAnnouncement | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("maintenance_announcements")
    .select(
      "id, scheduled_date, scheduled_time, duration_minutes, extra_message, is_active",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Ya no devuelve el aviso si la ventana de mantenimiento ya pasó —
  // "se desactiva solo" sin que nadie tenga que tocar la base de datos.
  return data && isAnnouncementVisible(data) ? data : null;
}

export async function createMaintenanceAnnouncement(
  createdBy: string,
  scheduledDate: string,
  scheduledTime: string,
  durationMinutes: number,
  extraMessage: string | null,
): Promise<void> {
  const supabase = createAdminClient();

  // Desactiva cualquier aviso anterior — solo debe haber uno activo a
  // la vez, para no mostrar dos banners contradictorios.
  await supabase
    .from("maintenance_announcements")
    .update({ is_active: false })
    .eq("is_active", true);

  const { error } = await supabase.from("maintenance_announcements").insert({
    scheduled_date: scheduledDate,
    scheduled_time: scheduledTime,
    duration_minutes: durationMinutes,
    extra_message: extraMessage,
    created_by: createdBy,
  });

  if (error) {
    throw new Error(`Error creando aviso de mantenimiento: ${error.message}`);
  }
}

export async function deactivateMaintenanceAnnouncement(
  id: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("maintenance_announcements")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    throw new Error(`Error desactivando aviso: ${error.message}`);
  }
}
