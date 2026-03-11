import { create } from 'zustand';

export const useLocationStore = create((set) => ({
  userLocation: null,
  nearbyAmbulances: [
    { id: '1', lat: 40.7138, lng: -74.0040, companyName: 'City Rescue Force', plateNumber: 'NY-112', eta: 5, distance: 1.2 },
    { id: '2', lat: 40.7108, lng: -74.0080, companyName: 'Rapid Med Transport', plateNumber: 'NY-499', eta: 8, distance: 2.1 },
  ],
  
  setUserLocation: (location) => set({ userLocation: location }),
  setNearbyAmbulances: (ambulances) => set({ nearbyAmbulances: ambulances }),
}));
