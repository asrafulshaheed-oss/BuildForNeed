import { useState } from "react";
import { UserRole } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Code, Terminal, Smartphone, MessageSquare, Landmark, Play, CheckCircle, ArrowRight, Lightbulb } from "lucide-react";

interface AnimatedIntroCarouselProps {
  role: UserRole;
  onComplete: () => void;
}

export function AnimatedIntroCarousel({ role, onComplete }: AnimatedIntroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const developerSlides = [
    {
      icon: <Terminal className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-[pulse_2s_infinite]" />,
      title: "Say Goodbye to Tutorial Hell",
      desc: "Stop cloning mock calculators or duplicate weather apps. Tech recruiters want to see genuine software designed for real human users.",
    },
    {
      icon: <Code className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
      title: "Real Backlogs, Live Specification",
      desc: "Browse a verified backlog of process bottlenecks. Propose solutions, negotiate specifications in comments, and link your public GitHub projects.",
    },
    {
      icon: <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
      title: "Grow Live Portfolio Ratings",
      desc: "Receive star ratings from original posters verifying your code's utility. Accumulate real portfolio weight to showcase on LinkedIn or in interviews.",
    },
  ];

  const sharerSlides = [
    {
      icon: <Lightbulb className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-[pulse_2s_infinite]" />,
      title: "Automate Your Operational Bottlenecks",
      desc: "Don't pay massive software agency fees. Post your manual spreadsheet formula errors, inventory bottlenecks, or bakery waste issues.",
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
      title: "Review Developer Proposals",
      desc: "Verified technical builders write working scripts, custom chrome plugins, or tailored dashboard tools to make your business run smooth.",
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
      title: "Elevate Best Suggested Plans",
      desc: "Use secure 3-star evaluation tools and reply threads to pick the most reliable open-source code repository directly.",
    },
  ];

  const slides = role === UserRole.DEVELOPER ? developerSlides : sharerSlides;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col items-center justify-between min-h-[380px] max-w-2xl mx-auto font-sans transition-all">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Progress Dots */}
      <div className="flex gap-2 mb-6">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentSlide ? "w-8 bg-indigo-600 dark:bg-indigo-505" : "w-2 bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Slide Motion Wrapper */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-800/85 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-inner">
              {slides[currentSlide].icon}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {slides[currentSlide].title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              {slides[currentSlide].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="w-full flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-8">
        <button
          type="button"
          onClick={onComplete}
          className="text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Skip Intro
        </button>

        <div className="flex items-center gap-2.5">
          {currentSlide > 0 && (
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => prev - 1)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl uppercase tracking-wider transition-all duration-200 cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl uppercase tracking-widest shadow-md transition-all duration-200 cursor-pointer flex items-center gap-1.5"
          >
            <span>{currentSlide === slides.length - 1 ? "Enter Platform" : "Continue"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
