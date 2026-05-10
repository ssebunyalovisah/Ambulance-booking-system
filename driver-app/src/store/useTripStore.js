import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTripStore = create(
    persist(
        (set, get) => ({
            currentTrip: null,
            tripHistory: [],
            setCurrentTrip: (trip) => set({ currentTrip: trip }),
            clearCurrentTrip: () => set({ currentTrip: null }),
            addToHistory: (trip) => set((state) => ({ tripHistory: [...state.tripHistory, trip] })),
        }),
        {
            name: 'driver-trip-storage',
        }
    )
);

export default useTripStore;