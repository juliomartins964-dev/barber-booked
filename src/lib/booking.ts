import { useSyncExternalStore } from "react";

export interface BookingState {
  servicoId: string | null;
  servicoNome: string | null;
  servicoDuracao: number | null;
  servicoPreco: number | null;
  barbeiroId: string | null;
  barbeiroNome: string | null;
  data: string | null;
  hora: string | null;
}

const initial: BookingState = {
  servicoId: null, servicoNome: null, servicoDuracao: null, servicoPreco: null,
  barbeiroId: null, barbeiroNome: null, data: null, hora: null,
};
let state: BookingState = { ...initial };
const listeners = new Set<() => void>();

export const bookingStore = {
  get: () => state,
  set: (s: Partial<BookingState>) => { state = { ...state, ...s }; listeners.forEach((l) => l()); },
  reset: () => { state = { ...initial }; listeners.forEach((l) => l()); },
};

export function useBooking() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state,
    () => state,
  );
}
