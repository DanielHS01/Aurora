import { Suspense } from "react";
import ConfirmEmailContent from "@/components/auth/ConfirmEmailContent";

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-white/50">
          Cargando...
        </div>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}