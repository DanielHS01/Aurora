'use client'

import { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiGlobe, FiImage } from 'react-icons/fi';

import {
  updateBusinessInfoAction,
  updateBusinessBrandingAction,
} from '@/lib/actions/business-actions';
import type { Business } from '@/lib/types';

const BRAND_PALETTES = [
  { id: 'classic', name: 'Clásico', primary: '#171717', secondary: '#FFFFFF' },
  { id: 'emerald', name: 'Esmeralda', primary: '#059669', secondary: '#FFFFFF' },
  { id: 'blue', name: 'Azul', primary: '#2563EB', secondary: '#FFFFFF' },
  { id: 'wine', name: 'Vino', primary: '#9F1239', secondary: '#FFFFFF' },
] as const;

interface AccountSettingsFormProps {
  business: Business;
  loginEmail: string;
}

export default function AccountSettingsForm({
  business,
  loginEmail,
}: AccountSettingsFormProps) {
  return (
    <div className="space-y-8">
      <AccountInfoCard loginEmail={loginEmail} />
      <BusinessInfoCard business={business} />
      <BrandingCard business={business} />
    </div>
  );
}

function AccountInfoCard({ loginEmail }: { loginEmail: string }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-black/50">
        Cuenta
      </h2>
      <p className="mb-6 text-sm text-black/40">
        Información de acceso a tu cuenta.
      </p>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
          Correo de acceso
        </span>
        <div className="relative">
          <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            type="email"
            value={loginEmail}
            disabled
            className="h-12 w-full cursor-not-allowed rounded-xl border border-black/10 bg-black/[0.03] pl-11 pr-4 text-sm text-black/50 outline-none"
          />
        </div>
        <p className="mt-2 text-xs text-black/35">
          Este es el correo con el que inicias sesión. Por ahora no se puede
          cambiar desde aquí.
        </p>
      </label>
    </section>
  );
}

function BusinessInfoCard({ business }: { business: Business }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(business.name ?? '');
  const [phone, setPhone] = useState(business.phone ?? '');
  const [address, setAddress] = useState(business.address ?? '');
  const [city, setCity] = useState(business.city ?? '');
  const [country, setCountry] = useState(business.country ?? '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('name', name.trim());
      formData.set('phone', phone.trim());
      formData.set('address', address.trim());
      formData.set('city', city.trim());
      formData.set('country', country.trim());

      await updateBusinessInfoAction(formData);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-black/50">
        Información del negocio
      </h2>
      <p className="mb-6 text-sm text-black/40">
        Estos datos aparecen en tu dashboard y en documentos como facturas.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Información actualizada correctamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Logo — placeholder hasta que definan la estrategia de imágenes */}
        <div>
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Logo
          </span>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-black/15 bg-black/[0.02] text-black/25">
              <FiImage size={22} />
            </div>
            <div>
              <button
                type="button"
                disabled
                title="Disponible próximamente"
                className="cursor-not-allowed rounded-xl border border-black/10 px-4 py-2 text-sm text-black/40"
              >
                Subir logo
              </button>
              <p className="mt-1 text-xs text-black/35">
                Disponible próximamente.
              </p>
            </div>
          </div>
        </div>

        <label className="block" htmlFor="businessName">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Nombre del negocio
          </span>
          <input
            id="businessName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
          />
        </label>

        <label className="block" htmlFor="phone">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Teléfono
          </span>
          <div className="relative">
            <FiPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-11 pr-4 text-sm outline-none focus:border-black/30"
            />
          </div>
        </label>

        <label className="block" htmlFor="address">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Dirección
          </span>
          <div className="relative">
            <FiMapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-11 pr-4 text-sm outline-none focus:border-black/30"
            />
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block" htmlFor="city">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              Ciudad
            </span>
            <input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30"
            />
          </label>

          <label className="block" htmlFor="country">
            <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
              País
            </span>
            <div className="relative">
              <FiGlobe className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-11 pr-4 text-sm outline-none focus:border-black/30"
              />
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Guardar información'}
        </button>
      </form>
    </section>
  );
}

function getActivePaletteId(business: Business): string {
  const match = BRAND_PALETTES.find(
    (p) =>
      p.primary.toLowerCase() === (business.primary_color ?? '').toLowerCase()
  );
  return match?.id ?? 'classic';
}

function BrandingCard({ business }: { business: Business }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedId, setSelectedId] = useState(getActivePaletteId(business));

  const selectedPalette =
    BRAND_PALETTES.find((p) => p.id === selectedId) ?? BRAND_PALETTES[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('paletteId', selectedId);

      await updateBusinessBrandingAction(formData);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-black/50">
        Marca
      </h2>
      <p className="mb-6 text-sm text-black/40">
        Elige la paleta de colores para tu dashboard.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Paleta actualizada. Recarga el dashboard para verla aplicada.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BRAND_PALETTES.map((palette) => {
            const isSelected = palette.id === selectedId;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => setSelectedId(palette.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                  isSelected
                    ? 'border-black ring-2 ring-black/20'
                    : 'border-black/10 hover:border-black/30'
                }`}
              >
                <span
                  className="h-10 w-10 rounded-full border border-black/10"
                  style={{ backgroundColor: palette.primary }}
                />
                <span className="text-xs font-medium text-black/70">
                  {palette.name}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center justify-between rounded-xl border border-black/10 p-4"
          style={{ backgroundColor: selectedPalette.primary }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: selectedPalette.secondary }}
          >
            Vista previa
          </span>
          <span
            className="rounded-lg px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: selectedPalette.secondary,
              color: selectedPalette.primary,
            }}
          >
            Botón
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Guardar paleta'}
        </button>
      </form>
    </section>
  );
}