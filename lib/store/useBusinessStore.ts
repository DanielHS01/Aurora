import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BusinessType = 'restaurant' | 'barbershop' | 'optical';

interface BusinessState {
  businessType: BusinessType | null;
  setBusinessType: (type: BusinessType) => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      businessType: null,
      setBusinessType: (type) => set({ businessType: type }),
    }),
    {
      name: 'business-storage', // Nombre para el localStorage
    }
  )
);