// Booking flow shared state via URL search params + simple store
import { create } from "zustand";

export interface BookingState {
  servicoId: string | null;
  servicoNome: string | null;
  servicoDuracao: number | null;
  servicoPreco: number | null;
  barbeiroId: string | null;
  barbeiroNome: string | null;
  data: string | null; // YYYY-MM-DD
  hora: string | null; // HH:MM
  set: (s: Partial<BookingState>) => void;
  reset: () => void;
}

// minimal store without external dep — implement manually
type Listener = () => void;
let state: BookingState;
const listeners = new Set<Listener>();
const initial = {
  servicoId: null, servicoNome: null, servicoDuracao: null, servicoPreco: null,
  barbeiroId: null, barbeiroNome: null, data: null, hora: null,
};
state = {
  ...initial,
  set: (s) => { state = { ...state, ...s }; listeners.forEach((l) => l()); },
  reset: () => { state = { ...state, ...initial }; listeners.forEach((l) => l()); },
};

import { useSyncExternalStore } from "react";
export function useBooking() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => state,
    () => state,
  );
}

// dummy export to silence zustand unused import (we don't actually use it)
export { create };
