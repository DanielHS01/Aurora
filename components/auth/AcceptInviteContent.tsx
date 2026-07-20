"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCheckCircle, FiAlertCircle, FiUserPlus, FiLock } from "react-icons/fi";

import { createClient } from "@/lib/supabase/client";
import { completeEmployeeInviteAction } from "@/lib/actions/auth-actions";

type Status = "idle" | "verifying" | "set-password" | "success" | "error";

export default function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const handleAccept = useCallback(async () => {
    if (!tokenHash || !type) {
      setStatus("error");
      setErrorMessage("El link de invitación no es válido.");
      return;
    }

    setStatus("verifying");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "invite",
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.toLowerCase().includes("expired")
          ? "Esta invitación ya expiró o ya fue usada. Pide que te reenvíen el correo."
          : "No pudimos validar la invitación."
      );
      return;
    }

    setStatus("set-password");
  }, [tokenHash, type]);

  async function handleSetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    try {
      await completeEmployeeInviteAction(password);
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm items-center justify-center p-4">
      <div className="w-full rounded-[2rem] border border-white/10 bg-black/55 p-8 text-center shadow-2xl backdrop-blur-2xl">
        {status === "idle" && (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
              <FiUserPlus size={21} />
            </div>
            <h2 className="text-2xl font-medium uppercase tracking-[-0.06em]">
              Te invitaron a un equipo
            </h2>
            <p className="mt-3 text-sm text-white/50">
              Acepta la invitación para crear tu contraseña y empezar a
              trabajar.
            </p>
            <button
              onClick={handleAccept}
              className="mt-6 h-12 w-full rounded-2xl bg-white text-sm font-medium uppercase text-black transition hover:bg-zinc-200"
            >
              Aceptar invitación
            </button>
          </>
        )}

        {status === "verifying" && (
          <p className="text-sm text-white/60">Validando invitación...</p>
        )}

        {status === "set-password" && (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
              <FiLock size={21} />
            </div>
            <h2 className="text-xl font-medium uppercase tracking-[-0.06em]">
              Crea tu contraseña
            </h2>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSetPassword} className="mt-5 space-y-3 text-left">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none"
              />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none"
              />
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-white text-sm font-medium uppercase text-black transition hover:bg-zinc-200"
              >
                Entrar
              </button>
            </form>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
              <FiCheckCircle size={21} />
            </div>
            <p className="text-sm text-white/70">
              Cuenta lista. Redirigiendo...
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