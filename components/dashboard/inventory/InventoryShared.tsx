'use client'

import { useState } from 'react';
import { FiX } from 'react-icons/fi';

import { inputUnitsFor, type InventoryUnit } from '@/lib/utils/inventory';

export const inputClass =
  'h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] px-4 text-sm outline-none focus:border-black/30';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            <FiX size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Campo de cantidad con selector de unidad (g/kg, ml/l). Siempre
 * entrega el valor en la unidad BASE del ingrediente.
 */
export function QuantityInput({
  unit,
  initial,
  onChange,
  autoFocus,
}: {
  unit: InventoryUnit;
  initial?: number;
  onChange: (baseValue: number | null) => void;
  autoFocus?: boolean;
}) {
  const options = inputUnitsFor(unit);
  const [raw, setRaw] = useState(initial !== undefined ? String(initial) : '');
  const [factor, setFactor] = useState(1);

  function emit(nextRaw: string, nextFactor: number) {
    const n = parseFloat(nextRaw.replace(',', '.'));
    onChange(Number.isFinite(n) ? Math.round(n * nextFactor * 1000) / 1000 : null);
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={raw}
        placeholder="0"
        onChange={(e) => {
          setRaw(e.target.value);
          emit(e.target.value, factor);
        }}
        className={inputClass}
      />
      {options.length > 1 ? (
        <select
          value={factor}
          onChange={(e) => {
            const next = Number(e.target.value);
            setFactor(next);
            emit(raw, next);
          }}
          className="h-12 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none"
        >
          {options.map((o) => (
            <option key={o.label} value={o.factor}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="flex h-12 items-center px-2 text-sm text-black/40">und</span>
      )}
    </div>
  );
}