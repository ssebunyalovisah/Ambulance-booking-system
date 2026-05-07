import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            
            // Optional: Only show the prompt if they haven't dismissed it recently
            const hasDismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!hasDismissed) {
                // Show the prompt after a slight delay so it's not too aggressive
                setTimeout(() => setShowPrompt(true), 3000);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            setShowPrompt(false);
            setDeferredPrompt(null);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Don't show again for a while
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl p-4 z-50 border border-slate-100"
                >
                    <button 
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-start gap-4">
                        <div className="bg-orange-100 p-3 rounded-2xl shrink-0">
                            <Download className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="pr-4">
                            <h3 className="font-bold text-slate-800 text-sm mb-1">Install Rapid Rescue</h3>
                            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                                Install our app to your home screen for quick access during emergencies. It works offline and takes almost no space!
                            </p>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleInstallClick}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors w-full"
                                >
                                    Install App
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
