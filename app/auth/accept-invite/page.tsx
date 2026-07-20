import { Suspense } from "react";
import AcceptInviteContent from "@/components/auth/AcceptInviteContent";

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-white/50">
          Cargando...
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}