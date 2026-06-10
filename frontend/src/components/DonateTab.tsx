import { motion } from "motion/react";
import { Heart, Coins, ShieldCheck, Check, Smartphone, Sparkles, Coffee, QrCode } from "lucide-react";
import bkashQr from "../assets/images/bkash.png";

export function DonateTab() {
  const steps = [
    {
      icon: <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: "1. Open Mobile Payment App",
      desc: "Launch your preferred bKash or financial wallet scan tool on your device.",
    },
    {
      icon: <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      title: "2. Scan the QR Code",
      desc: "Center the QR code below in the camera viewfinder to instantly retrieve deposit details.",
    },
    {
      icon: <Coffee className="w-5 h-5 text-amber-500" />,
      title: "3. Complete Your Contribution",
      desc: "Specify your desired support amount and confirm. Every contribution sustains server runtimes.",
    },
  ];

  return (
    <div id="donate-platform-view" className="max-w-4xl mx-auto space-y-12 py-6 font-sans">
      
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 rounded-full tracking-wider uppercase"
        >
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
          Support Our Community
        </motion.span>
        
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-5xl tracking-tight font-display bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 dark:from-slate-100 dark:via-rose-300 dark:to-slate-100 bg-clip-text text-transparent">
          Support Build For Need
        </h2>
        
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed">
          This platform connects real-world problems with developers who want to build meaningful solutions. Your support helps improve the platform and keep it running.
        </p>
      </div>

      {/* Main Grid: QR Card and Guideline Steps */}
      <div className="grid md:grid-cols-12 gap-8 items-start">
        
        {/* 1) Outer donation card - Clean, focused layout */}
        <div 
          id="qr-donation-card" 
          className="md:col-span-6 glass-card-premium p-6 sm:p-8 rounded-3xl flex flex-col items-center justify-center w-full relative"
        >
          {/* Clear, mobile-friendly instructional heading above the QR code explaining scan behavior */}
          <div className="text-center mb-6 max-w-sm">
            <span className="text-xs font-extrabold uppercase text-rose-600 dark:text-rose-400 tracking-wider block mb-1">
              Scan to Pay & Contribute
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
              Scan with bKash or banking wallet app
            </h3>
            <p className="text-[11px] text-slate-550 dark:text-slate-405 mt-2 leading-relaxed">
              Open your preferred mobile financial wallet app (e.g., bKash, banking or digital wallet app), select the &quot;Scan QR&quot; / &quot;QR Pay&quot; option, and point your camera at the QR code below.
            </p>
          </div>

          {/* 2) One inner QR holder - Exact desktop (380px) and mobile (300px) square dimensions matching specs */}
          <div 
            id="qr-image-holder" 
            className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] max-w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 shadow-inner mx-auto overflow-hidden relative group"
          >
            {/* Laser scanning line animation effect */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500 animate-[bounce_3s_infinite] shadow-[0_2px_10px_#f43f5e] opacity-80 z-10" />
            
            {/* Corner bracket accents to simulate a camera capture screen */}
            <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-rose-500 rounded-tl-sm animate-pulse" />
            <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-rose-500 rounded-tr-sm animate-pulse" />
            <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-rose-500 rounded-bl-sm animate-pulse" />
            <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-rose-500 rounded-br-sm animate-pulse" />

            {/* Render the official bKash QR Code image */}
            <img 
              src={bkashQr} 
              alt="bKash QR Code 01838275530" 
              className="w-full h-full object-contain rounded-xl select-none z-0"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1.5 mt-6 text-center max-w-sm">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center justify-center gap-1.5 font-sans">
              <Coins className="w-4 h-4 text-rose-500 shrink-0" />
              Direct Support QR Code
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-405 leading-relaxed">
              This official contribution path remains uncompressed and fully scannable across all devices to sustain our server platforms.
            </p>
          </div>
        </div>

        {/* Steps and Security Checklist */}
        <div className="md:col-span-6 space-y-6">
          
          <div className="glass-panel-premium rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              How it works
            </h3>
            
            <div className="space-y-4">
              {steps.map((st, idx) => (
                <div key={idx} className="flex gap-3.5 items-start">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 mt-0.5">
                    {st.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{st.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secure & direct banner */}
          <div className="bg-indigo-50/50 dark:bg-slate-900/60 rounded-2xl p-6 border border-indigo-100/70 dark:border-slate-800/80 shadow-xs relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex gap-3.5 items-start relative z-10">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/25 text-indigo-700 dark:text-indigo-400 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm tracking-tight text-slate-850 dark:text-slate-100">100% Platform Direct</h4>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  We collect no fees on donations. Every single cent of funding directly fuels database resources, community rpc lookups, and developer server hostings.
                </p>
              </div>
            </div>
          </div>

          {/* Sincere Platform Thank-You */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 italic">
            Thank you for being an essential part of Build For Need! Your generosity keeps real human needs connected to software solutions.
          </p>

        </div>

      </div>

    </div>
  );
}
