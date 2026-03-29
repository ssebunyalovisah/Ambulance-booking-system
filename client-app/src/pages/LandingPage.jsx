import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Clock, MapPin, ShieldAlert, ArrowRight } from 'lucide-react';
import heroBg from '../assets/Ambulance.jpg';
import featureGlobe from '../assets/feature-globe.jpg';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-600 p-2 rounded-xl text-white">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">MediRide</span>
          </div>
          <div>
            <button
              onClick={() => {
                window.isClientNav = true;
                navigate('/map');
              }}
              className="bg-orange-100 text-orange-600 px-4 py-2 font-bold rounded-lg hover:bg-orange-200 transition-colors"
            >
              Emergency Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-16 pb-32 flex content-center items-center justify-center min-h-[90vh]">
        <div className="absolute top-0 w-full h-full bg-center bg-cover" style={{ backgroundImage: `url(${heroBg})` }}>
          <span id="blackOverlay" className="w-full h-full absolute opacity-70 bg-slate-900"></span>
        </div>
        <div className="container relative mx-auto px-4">
          <div className="items-center flex flex-wrap">
            <div className="w-full lg:w-6/12 px-4 ml-auto mr-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="pr-12"
              >
                <h1 className="text-white font-black text-4xl leading-tight sm:text-6xl px-2">
                  Fastest Way to Get an <span className="text-orange-500">Ambulance</span>
                </h1>
                <p className="mt-4 text-base sm:text-lg text-slate-200 font-medium px-4">
                  We detect your location instantly and match you with the nearest emergency vehicles. No account needed.
                </p>

                <div className="mt-10 mb-8 sm:flex sm:justify-center px-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      window.isClientNav = true;
                      navigate('/map');
                    }}
                    className="w-full sm:w-auto flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-orange-600 hover:bg-orange-700 md:py-5 md:text-xl md:px-10 shadow-lg shadow-orange-500/30 transition-all group"
                  >
                    Request Emergency Now
                    <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <section className="pb-20 bg-slate-50 -mt-24 relative z-10 px-2 sm:px-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-y-6 md:gap-y-0">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full md:w-4/12 px-4 text-center"
            >
              <div className="relative flex flex-col min-w-0 break-words bg-white w-full shadow-xl rounded-3xl">
                <div className="px-6 py-8 flex-auto">
                  <div className="text-white p-4 text-center inline-flex items-center justify-center w-16 h-16 mb-5 shadow-lg rounded-full bg-blue-500">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <h6 className="text-xl font-bold text-slate-800">Smart Location</h6>
                  <p className="mt-2 text-slate-500 font-medium">
                    We automatically track your GPS coordinates and find drivers closest to your location.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="w-full md:w-4/12 px-4 text-center"
            >
              <div className="relative flex flex-col min-w-0 break-words bg-white w-full shadow-xl rounded-3xl">
                <div className="px-6 py-8 flex-auto">
                  <div className="text-white p-4 text-center inline-flex items-center justify-center w-16 h-16 mb-5 shadow-lg rounded-full bg-orange-500">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h6 className="text-xl font-bold text-slate-800">Ultra-Fast Response</h6>
                  <p className="mt-2 text-slate-500 font-medium">
                    Our network of certified ambulances ensures minimal wait times and real-time ETAs.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="w-full md:w-4/12 px-4 text-center"
            >
              <div className="relative flex flex-col min-w-0 break-words bg-white w-full shadow-xl rounded-3xl">
                <div className="px-6 py-8 flex-auto">
                  <div className="text-white p-4 text-center inline-flex items-center justify-center w-16 h-16 mb-5 shadow-lg rounded-full bg-emerald-500">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h6 className="text-xl font-bold text-slate-800">No Sign-up Required</h6>
                  <p className="mt-2 text-slate-500 font-medium">
                    1-Click booking process. No hurdles in stressful situations. Request and track instantly.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-wrap items-center mt-24">
            <div className="w-full md:w-5/12 px-4 mr-auto ml-auto mb-12 sm:mb-0">
              <div className="text-slate-500 p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-white">
                <Stethoscope className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-2xl sm:text-3xl mb-2 font-bold leading-tight text-slate-900">
                Global Standards of Medical Transport
              </h3>
              <p className="text-base sm:text-lg font-medium leading-relaxed mt-4 mb-4 text-slate-600">
                Our platform aggregates multiple reputable hospital services and independent ambulance providers to get you life-saving help swiftly.
              </p>
              <p className="text-base sm:text-lg font-medium leading-relaxed mt-0 mb-4 text-slate-600">
                The transparent tracking features give your loved ones peace of mind during highly stressful transit periods.
              </p>
            </div>

            <div className="w-full md:w-4/12 px-4 mr-auto ml-auto mt-12 md:mt-0">
              <div className="relative flex flex-col min-w-0 break-words w-full shadow-2xl rounded-3xl overflow-hidden bg-orange-600">
                <img
                  alt="Medical care parameters"
                  src={featureGlobe}
                  className="w-full align-middle h-64 sm:h-80 object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 pt-10 pb-6 text-slate-400">
        <div className="container mx-auto px-4 text-center">
          <p className="font-medium text-sm">
            &copy; {new Date().getFullYear()} Rapid Rescue - Emergency System. For demo purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
