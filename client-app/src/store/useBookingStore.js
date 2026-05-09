import { create } from 'zustand';

export const useBookingStore = create((set) => ({
  activeBookingId: null,
  bookingStatus: null,
  selectedAmbulance: null,
  isBookingModalOpen: false,
  isTripCompleted: false,
  driverLocation: null,
  
  setSelectedAmbulance: (ambulance) => set({ selectedAmbulance: ambulance }),
  openBookingModal: () => set({ isBookingModalOpen: true }),
  closeBookingModal: () => set({ isBookingModalOpen: false }),
  setActiveBooking: (id, status) => set({ activeBookingId: id, bookingStatus: status, isTripCompleted: false }),
  setDriverLocation: (loc) => set({ driverLocation: loc }),
  completeTrip: () => set({ isTripCompleted: true }),
  clearBooking: () => set({ activeBookingId: null, bookingStatus: null, selectedAmbulance: null, isTripCompleted: false, driverLocation: null })
}));
