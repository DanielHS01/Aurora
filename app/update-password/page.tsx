import { Suspense } from "react";
import UpdatePasswordContent from "@/components/auth/UpdatePasswordContent";

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/50">
          Cargando...
        </div>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}