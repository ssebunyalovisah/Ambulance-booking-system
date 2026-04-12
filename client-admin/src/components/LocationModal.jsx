import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';

// Fix for default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationModal = ({ lat, lng, address, onClose }) => {
    if (!lat || !lng) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[600px]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-xl z-10">
                    <div>
                        <h3 className="font-bold text-slate-800">Pickup Location</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[400px]">{address}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 relative z-0">
                    <MapContainer 
                        center={[lat, lng]} 
                        zoom={15} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                        <Marker position={[lat, lng]}>
                            <Popup>
                                <span className="text-xs font-bold">{address}</span>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Leaflet + OpenStreetMap Integration
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
