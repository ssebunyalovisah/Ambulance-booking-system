import { create } from 'zustand';

export const useLocationStore = create((set) => ({
  userLocation: null,
  locationLoading: true,
  nearbyAmbulances: [],

  setUserLocation: (location) => set({ userLocation: location }),
  setLocationLoading: (loading) => set({ locationLoading: loading }),
  setNearbyAmbulances: (ambulances) => set({ nearbyAmbulances: ambulances }),
}));
