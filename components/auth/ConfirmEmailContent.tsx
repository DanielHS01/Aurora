"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCheckCircle, FiAlertCircle, FiMail } from "react-icons/fi";

import { createClient } from "@/lib/supabase/client";
import { completeBusinessSetupAction } from "@/lib/actions/auth-actions";

type Status = "idle" | "verifying" | "success" | "error";

export default function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/test-business";

  const handleConfirm = useCallback(async () => {
    if (!tokenHash || !type) {
      setStatus("error");
      setErrorMessage("El link de confirmación no es válido.");
      return;
    }

    setStatus("verifying");

    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email_change" | "recovery" | "invite",
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.toLowerCase().includes("expired")
          ? "Este link ya expiró o ya fue usado. Intenta registrarte de nuevo o inicia sesión."
          : "No pudimos confirmar tu correo. Intenta de nuevo."
      );
      return;
    }

    try {
      await completeBusinessSetupAction();
    } catch (err) {
      console.error("Error creando negocio tras confirmación:", err);
    }

    setStatus("success");
    setTimeout(() => router.push(next), 1200);
  }, [tokenHash, type, next, router]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm items-center justify-center">
      <div className="w-full rounded-[2rem] border border-white/10 bg-black/55 p-8 text-center shadow-2xl backdrop-blur-2xl">
        {status === "idle" && (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
              <FiMail size={21} />
            </div>
            <h2 className="text-2xl font-medium uppercase tracking-[-0.06em]">
              Confirma tu cuenta
            </h2>
            <p className="mt-3 text-sm text-white/50">
              Haz clic en el botón para activar tu cuenta y crear tu
              workspace.
            </p>
            <button
              onClick={handleConfirm}
              className="mt-6 h-12 w-full rounded-2xl bg-white text-sm font-medium uppercase text-black transition hover:bg-zinc-200"
            >
              Confirmar mi cuenta
            </button>
          </>
        )}

        {status === "verifying" && (
          <p className="text-sm text-white/60">Confirmando...</p>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
              <FiCheckCircle size={21} />
            </div>
            <p className="text-sm text-white/70">
              Cuenta confirmada. Redirigiendo...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
              <FiAlertCircle size={21} />
            </div>
            <p className="text-sm text-red-300">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  );
}