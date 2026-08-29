import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";



const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/auth/callback",
  "/auth/confirm",
  "/auth/accept-invite",
  "/reset-password",
  "/update-password",
  "/maintenance",
];

// Caché breve en memoria — evita consultar Supabase en cada request
// mientras no hay mantenimiento. Vive mientras la instancia de Edge
// esté "caliente"; en el peor caso, el bloqueo tarda hasta 15s en
// activarse tras crear el aviso, lo cual es aceptable ya que el
// mantenimiento se programa con anticipación, no es instantáneo.
let maintenanceCache: { value: boolean; expiresAt: number } | null = null;
const CACHE_TTL_MS = 15000;

async function checkMaintenanceActive(
  supabase: ReturnType<typeof createServerClient>,
): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && maintenanceCache.expiresAt > now) {
    return maintenanceCache.value;
  }
  const { data } = await supabase.rpc("is_maintenance_active");
  const value = Boolean(data);
  maintenanceCache = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}

function redirectWithCookies(url: URL, response: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  return redirectResponse;
}
const MAINTENANCE_EXEMPT_ROUTES = ["/login", "/maintenance"];
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  // Webhooks y cron jobs son comunicación servidor-a-servidor (Meta,
  // 360dialog, Bold, Vercel Cron) — nunca deben verse afectados por el
  // mantenimiento ni por el chequeo de sesión de usuario. Bloquearlos
  // rompería la entrega de mensajes/pagos entrantes durante ese tiempo.
  if (pathname.startsWith("/api/")) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isAdminRoute) {
    const maintenanceActive = await checkMaintenanceActive(supabase);

    if (maintenanceActive) {
      let isPlatformAdmin = false;
      if (user) {
        const { data } = await supabase.rpc("is_current_user_platform_admin");
        isPlatformAdmin = Boolean(data);
      }

      if (!isPlatformAdmin) {
        if (user) {
          await supabase.auth.signOut();
        }

        const isExempt =
          pathname === "/" ||
          MAINTENANCE_EXEMPT_ROUTES.some((route) => pathname.startsWith(route));

        if (!isExempt) {
          return redirectWithCookies(
            new URL("/maintenance", request.url),
            response,
          );
        }
        return response;
      }
    }
  }

  if (!user && !isPublicRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return redirectWithCookies(redirectUrl, response);
  }

  if (user && pathname === "/login") {
    return redirectWithCookies(new URL("/dashboard", request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
