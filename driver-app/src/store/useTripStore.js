import { create } from 'zustand';

const useTripStore = create((set, get) => ({
    currentTrip: null,
    tripHistory: [],
    setCurrentTrip: (trip) => set({ currentTrip: trip }),
    clearCurrentTrip: () => set({ currentTrip: null }),
    addToHistory: (trip) => set((state) => ({ tripHistory: [...state.tripHistory, trip] })),
}));

export default useTripStore;