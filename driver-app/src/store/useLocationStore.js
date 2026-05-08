import { create } from 'zustand';

const useLocationStore = create((set) => ({
    driverLocation: null,
    patientLocation: null,
    setDriverLocation: (location) => set({ driverLocation: location }),
    setPatientLocation: (location) => set({ patientLocation: location }),
}));

export default useLocationStore;