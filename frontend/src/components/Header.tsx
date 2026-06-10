import { User, UserRole } from "../types";
import { LogOut, BookOpen, Sparkles, HelpCircle, Code, User as UserIcon, Lightbulb, Menu, X, Sun, Moon, Heart, Check, Wrench, Settings, Layers, Bookmark, History, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";
import { GeminiChatbot } from "./GeminiChatbot";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface HeaderProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRoleSwitch: (newRole: UserRole) => void;
  onLogout: () => void;
  onBrandClick?: () => void;
  categories?: string[];
  activeCategory?: string;
  setActiveCategory?: (category: string) => void;
  showBookmarksOnly?: boolean;
  setShowBookmarksOnly?: (show: boolean) => void;
  setShowIntroSequence?: (show: boolean) => void;
  difficultyTrendsData?: any[];
}

export function Header({
  currentUser,
  activeTab,
  setActiveTab,
  onRoleSwitch,
  onLogout,
  onBrandClick,
  categories = [],
  activeCategory = "all",
  setActiveCategory,
  showBookmarksOnly = false,
  setShowBookmarksOnly,
  setShowIntroSequence,
  difficultyTrendsData = []
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [mobileConfirmSignOut, setMobileConfirmSignOut] = useState(false);

  // Prevent body scrolling when mobile drawer navigation is active, cleanly restoring scroll behavior on unmount or close
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setMobileConfirmSignOut(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Cleanly close mobile menu drawer when full page AI Workspace is active
  useEffect(() => {
    if (activeTab === "gemini-workspace") {
      setMobileMenuOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleOpenMobileMenu = () => {
      setMobileMenuOpen(true);
    };
    window.addEventListener("open-mobile-menu" as any, handleOpenMobileMenu);
    return () => {
      window.removeEventListener("open-mobile-menu" as any, handleOpenMobileMenu);
    };
  }, []);

  return (
    <header id="app-main-header" className="fixed top-0 left-0 right-0 z-[100] w-full border-b border-white/10 dark:border-slate-850/40 bg-white/75 dark:bg-slate-950/70 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto w-full max-w-[1600px] px-[clamp(1rem,4vw,3rem)] py-2 transition-all">
        <div className="flex h-16 items-center justify-between gap-6 lg:gap-10">
          
          {/* Brand Logo & Name - Clickable and Glass Integrated */}
          <button
            onClick={onBrandClick}
            className="flex items-center gap-3 shrink-0 focus:outline-hidden group cursor-pointer text-left rounded-xl p-1 transition-all"
            title="Jump to problem feed"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-100 dark:shadow-none group-hover:scale-105 group-hover:rotate-6 transition-transform duration-300 overflow-hidden">
              <Lightbulb className="h-6 w-6 stroke-[1.8]" />
              <div className="absolute inset-0 flex items-center justify-center pt-0.5 pb-2.5">
                <Settings className="h-3 w-3 text-indigo-200 animate-spin-slow stroke-[2.2]" />
              </div>
            </div>
            <span className="text-[clamp(15px,1.1vw,20px)] font-black tracking-tight text-slate-900 dark:text-slate-100 font-sans hidden sm:inline-block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-250">
              Build For Need
            </span>
          </button>

          {/* Navigation Items (Desktop) - Enhanced responsive gap and padding */}
          <nav className="hidden md:flex items-center gap-[clamp(0.5rem,1.2vw,1.75rem)]">
            <button
              onClick={() => { setActiveTab("feed"); setMobileMenuOpen(false); }}
              className={`px-[clamp(0.75rem,0.9vw,1.25rem)] py-[clamp(0.4rem,0.6vw,0.6rem)] rounded-xl text-[clamp(13px,0.95vw,15px)] font-bold transition-all cursor-pointer ${
                activeTab === "feed"
                  ? "bg-slate-50 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
              }`}
            >
              Problem Feed
            </button>
            <button
              onClick={() => { setActiveTab("about"); setMobileMenuOpen(false); }}
              className={`px-[clamp(0.75rem,0.9vw,1.25rem)] py-[clamp(0.4rem,0.6vw,0.6rem)] rounded-xl text-[clamp(13px,0.95vw,15px)] font-bold transition-all cursor-pointer ${
                activeTab === "about"
                  ? "bg-slate-50 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => { setActiveTab("faq"); setMobileMenuOpen(false); }}
              className={`px-[clamp(0.75rem,0.9vw,1.25rem)] py-[clamp(0.4rem,0.6vw,0.6rem)] rounded-xl text-[clamp(13px,0.95vw,15px)] font-bold transition-all cursor-pointer ${
                activeTab === "faq"
                  ? "bg-slate-50 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
              }`}
            >
              FAQ
            </button>
            {currentUser && (
              <button
                onClick={() => { setActiveTab("gemini-workspace"); setMobileMenuOpen(false); }}
                className={`px-[clamp(0.75rem,0.9vw,1.25rem)] py-[clamp(0.4rem,0.6vw,0.6rem)] rounded-xl text-[clamp(13px,0.95vw,15px)] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === "gemini-workspace"
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse font-bold" />
                <span>AI Workspace</span>
              </button>
            )}
            <button
              onClick={() => { setActiveTab("donate"); setMobileMenuOpen(false); }}
              className={`px-[clamp(0.75rem,0.9vw,1.25rem)] py-[clamp(0.4rem,0.6vw,0.6rem)] rounded-xl text-[clamp(13px,0.95vw,15px)] font-bold transition-all cursor-pointer ${
                activeTab === "donate"
                  ? "bg-slate-50 dark:bg-slate-800/60 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
              }`}
            >
              Donate
            </button>
          </nav>

          {/* Role Toggle Switch & User Section */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            
            {/* Liquid-glass Animated Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-250/30 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-100/60 dark:hover:bg-slate-800/80 cursor-pointer backdrop-blur-xs transition-colors p-2"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "light" ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14 }}
                  >
                    <Sun className="h-4.5 w-4.5 text-amber-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14 }}
                  >
                    <DarkMoonIcon />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {currentUser && activeTab === "feed" && (
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 border border-slate-200/50 dark:border-slate-700/50">
                <button
                  onClick={() => onRoleSwitch(UserRole.PROBLEM_SHARER)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    currentUser.rolePreference === UserRole.PROBLEM_SHARER
                      ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs border border-slate-200/30"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-indigo-200"
                  }`}
                  title="Switch to Problem Sharer view"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sharer</span>
                </button>
                <button
                  onClick={() => onRoleSwitch(UserRole.DEVELOPER)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    currentUser.rolePreference === UserRole.DEVELOPER
                      ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-350 shadow-xs border border-slate-200/30"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-indigo-200"
                  }`}
                  title="Switch to Developer view"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dev</span>
                </button>
              </div>
            )}

            {/* Profile & Signout UI */}
            {currentUser ? (
              <div className="hidden md:flex items-center gap-2 relative">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 capitalize bg-slate-50 dark:bg-slate-800/50 border border-slate-100/55 dark:border-slate-700/40 rounded px-1.5 py-0.5 mt-0.5 tracking-wider font-mono">
                    {currentUser.rolePreference.replace('_', ' ')}
                  </span>
                </div>

                {/* Custom STATEFUL LOGOUT POPOVER */}
                {mobileMenuOpen ? null : (
                  <AnimatePresence>
                    {showConfirmLogout && (
                      <div className="absolute right-0 top-12 z-50 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl shadow-xl flex flex-col gap-2 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">Confirm Sign Out?</span>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setShowConfirmLogout(false)}
                            className="bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-50 border border-slate-300 dark:border-slate-700 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer focus:ring-2 focus:ring-indigo-505"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setShowConfirmLogout(false);
                              onLogout();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm focus:ring-2 focus:ring-rose-505"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                )}

                <button
                  onClick={() => setShowConfirmLogout(!showConfirmLogout)}
                  className={`rounded-xl border p-2.5 transition-all focus:outline-hidden cursor-pointer ${
                    showConfirmLogout
                      ? "bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-100 dark:hover:border-rose-900"
                  }`}
                  title="Sign out of account"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {/* Mobile Menu trigger */}
            <button
              id="mobile-hamburger-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden shrink-0 relative z-[200] rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer min-w-[44px] min-h-[44px] w-11 h-11 items-center justify-center transition-all shadow-xs pointer-events-auto"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated mobile drawer-based navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[9999]">
            {/* Backdrop */}
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileMenuOpen(false)}
              className={`fixed inset-0 z-[9998] backdrop-blur-md cursor-pointer ${
                theme === "dark" ? "bg-slate-950/90" : "bg-slate-900/60"
              }`}
            />
            {/* Full-screen Overlay Content */}
            <motion.div
              key="mobile-nav-drawer"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`header-mobile-menu-container fixed inset-0 z-[9999] w-screen h-[100dvh] flex flex-col justify-between shadow-2xl p-[clamp(1rem,4vw,3rem)] focus:outline-hidden ${
                theme === "dark"
                  ? "bg-transparent text-slate-100"
                  : "bg-transparent text-slate-900"
              }`}
            >
              {/* Perfect matched header within overlay */}
              <div className="w-full flex items-center justify-between h-16 shrink-0">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBrandClick?.();
                  }}
                  className="flex items-center gap-3 cursor-pointer text-left focus:outline-none"
                >
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-md overflow-hidden">
                    <Lightbulb className="h-6 w-6 stroke-[1.8]" />
                    <div className="absolute inset-0 flex items-center justify-center pt-0.5 pb-2.5">
                      <Settings className="h-3 w-3 text-indigo-200 animate-spin-slow stroke-[2.2]" />
                    </div>
                  </div>
                  <span className="text-md font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-sans hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    Build For Need
                  </span>
                </button>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-750 p-2.5 text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer w-11 h-11 flex items-center justify-center transition-all shadow-xs"
                  aria-label="Close Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Main centered navigation content - Centered perfectly vertically and horizontally */}
              <div className="flex-1 flex flex-col justify-center items-center py-6 gap-8 w-full max-w-sm mx-auto shrink-0 select-none">
                <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider font-mono select-none">
                  Navigation Menu
                </span>

                <nav className="flex flex-col gap-4 w-full items-center">
                  <button
                    onClick={() => { setActiveTab("feed"); setMobileMenuOpen(false); }}
                    className={`px-6 py-4.5 rounded-2xl text-[20px] font-bold transition-all w-full flex items-center justify-between border cursor-pointer hover:shadow-md active:scale-[0.98] ${
                      activeTab === "feed"
                        ? "bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-500/10"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <BookOpen className={`w-5.5 h-5.5 shrink-0 ${activeTab === "feed" ? "text-white" : "text-indigo-500"}`} />
                      <span>Problem Feed</span>
                    </div>
                    {activeTab === "feed" && <Check className="w-5 h-5 text-indigo-200" />}
                  </button>

                  <button
                    onClick={() => { setActiveTab("about"); setMobileMenuOpen(false); }}
                    className={`px-6 py-4.5 rounded-2xl text-[20px] font-bold transition-all w-full flex items-center justify-between border cursor-pointer hover:shadow-md active:scale-[0.98] ${
                      activeTab === "about"
                        ? "bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-500/10"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Sparkles className={`w-5.5 h-5.5 shrink-0 ${activeTab === "about" ? "text-white" : "text-indigo-500"}`} />
                      <span>About Us</span>
                    </div>
                    {activeTab === "about" && <Check className="w-5 h-5 text-indigo-200" />}
                  </button>

                  <button
                    onClick={() => { setActiveTab("faq"); setMobileMenuOpen(false); }}
                    className={`px-6 py-4.5 rounded-2xl text-[20px] font-bold transition-all w-full flex items-center justify-between border cursor-pointer hover:shadow-md active:scale-[0.98] ${
                      activeTab === "faq"
                        ? "bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-500/10"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <HelpCircle className={`w-5.5 h-5.5 shrink-0 ${activeTab === "faq" ? "text-white" : "text-indigo-500"}`} />
                      <span>FAQ</span>
                    </div>
                    {activeTab === "faq" && <Check className="w-5 h-5 text-indigo-200" />}
                  </button>

                  {/* Gemini Assistant Chatbot Widget - Perfectly placed below FAQ and above Donate option as requested */}
                  <GeminiChatbot userId={currentUser?.id} initialCollapsed={true} />

                  <button
                    onClick={() => { setActiveTab("donate"); setMobileMenuOpen(false); }}
                    className={`px-6 py-4.5 rounded-2xl text-[20px] font-bold transition-all w-full flex items-center justify-between border cursor-pointer hover:shadow-md active:scale-[0.98] ${
                      activeTab === "donate"
                        ? "bg-rose-600 border-rose-700 text-white shadow-lg shadow-rose-500/10"
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Heart className={`w-5.5 h-5.5 shrink-0 ${activeTab === "donate" ? "text-white fill-white" : "text-rose-500 fill-rose-500"}`} />
                      <span>Donate</span>
                    </div>
                    {activeTab === "donate" && <Check className="w-5 h-5 text-rose-200" />}
                  </button>

                  {/* Enlarged Wide Theme Mode selection box */}
                  <button
                    onClick={toggleTheme}
                    className="px-6 py-4.5 rounded-2xl text-[20px] font-bold transition-all w-full flex items-center justify-between border cursor-pointer hover:shadow-md active:scale-[0.98] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                    title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
                  >
                    <div className="flex items-center gap-3.5">
                      {theme === "light" ? (
                        <Sun className="w-5.5 h-5.5 shrink-0 text-amber-500 animate-spin-slow" />
                      ) : (
                        <Moon className="w-5.5 h-5.5 shrink-0 text-indigo-400" />
                      )}
                      <span>Theme Mode: <span className="capitalize font-black text-indigo-600 dark:text-indigo-400">{theme}</span></span>
                    </div>
                    <div className="text-[10px] uppercase font-black tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                      Switch Mode
                    </div>
                  </button>
                </nav>

                {/* Additional Sidebar Widgets moved into Mobile Menu between Theme Switcher and Sign Out */}
                <div className="w-full flex flex-col gap-6 border-t border-slate-200 dark:border-slate-800/60 pt-6 max-w-sm">
                  
                  {/* Browse Categories Widget */}
                  <div className="w-full bg-slate-150/50 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-505 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Browse Categories
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setActiveCategory?.("all");
                          setShowBookmarksOnly?.(false);
                          setActiveTab("feed");
                          setMobileMenuOpen(false);
                        }}
                        className={`text-left px-2.5 py-2 rounded-xl text-xs font-bold truncate transition-all duration-200 cursor-pointer ${
                          activeCategory === "all" && !showBookmarksOnly && activeTab === "feed"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                        }`}
                      >
                        All Problems
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setActiveCategory?.(cat);
                            setShowBookmarksOnly?.(false);
                            setActiveTab("feed");
                            setMobileMenuOpen(false);
                          }}
                          className={`text-left px-2.5 py-2 rounded-xl text-xs font-bold truncate transition-all duration-200 cursor-pointer ${
                            activeCategory === cat && !showBookmarksOnly && activeTab === "feed"
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Spotlight Goal Widget */}
                  <div className="w-full bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-4.5 text-white shadow-sm space-y-3">
                    <span className="bg-white/20 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                      Spotlight Goal
                    </span>
                    <h4 className="font-bold text-xs leading-snug">
                      Empowering Anyone to Initiate Software
                    </h4>
                    <p className="text-indigo-100 text-[11px] leading-relaxed">
                      Our vision is to build solutions for real humans. Think of Build For Need as Facebook feed tailored for real problems and open-source outcomes.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab("about");
                        setMobileMenuOpen(false);
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 py-2 rounded-xl flex items-center justify-center gap-1.5 w-full transition-all cursor-pointer"
                    >
                      <span>Learn Our Story</span>
                      <ArrowRight className="w-3" />
                    </button>
                  </div>

                  {/* Difficulty Trends Chart Widget */}
                  {difficultyTrendsData && difficultyTrendsData.length > 0 && (
                    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/55 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-indigo-550 dark:text-indigo-400" />
                          Difficulty Trends
                        </h3>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider">
                          Outlook
                        </span>
                      </div>
                      <div className="h-24 w-full pr-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={difficultyTrendsData}
                            margin={{ top: 2, right: 2, left: -25, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="mobileDifficultyGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"}
                            />
                            <XAxis
                              dataKey="name"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: "#94a3b8", fontSize: 8, fontWeight: 600 }}
                              interval={8}
                            />
                            <YAxis
                              domain={[1, 5]}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: "#94a3b8", fontSize: 8, fontWeight: 600 }}
                              ticks={[1, 3, 5]}
                            />
                            <Area
                              type="monotone"
                              dataKey="difficulty"
                              stroke="#6366f1"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#mobileDifficultyGrad)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Profile Status Widget */}
                  {currentUser && (
                    <div className="w-full bg-slate-100/60 dark:bg-slate-900/50 border border-slate-205 dark:border-slate-800 rounded-2xl p-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-2">
                      <div className="font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wide text-[10px]">
                        Your Profile Status
                      </div>
                      <p className="leading-relaxed">
                        Logged in as <strong className="text-slate-900 dark:text-slate-100">{currentUser.name}</strong>. Active dashboard role: <strong className="text-indigo-600 dark:text-indigo-400 uppercase font-mono">{currentUser.rolePreference.replace("_", " ")}</strong>.
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono mt-1 text-slate-400 dark:text-slate-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
                        <span>JWT Secure Client Node</span>
                      </div>
                    </div>
                  )}

                  {/* Our Code Philosophy Widget */}
                  <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 text-xs space-y-2.5">
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                      Our Code Philosophy
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 leading-normal text-[11px]">
                      Review the active mission campaign detailing how we solve real issues:
                    </p>
                    <button
                      onClick={() => {
                        setShowIntroSequence?.(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-50/85 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-900/40 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Replay Mission Intro
                    </button>
                  </div>

                </div>

                {currentUser && (
                  <div className="w-full space-y-2 border-t border-slate-200 dark:border-slate-800/60 pt-6">
                    {!mobileConfirmSignOut ? (
                      <button
                        onClick={() => setMobileConfirmSignOut(true)}
                        className="px-6 py-4.5 rounded-2xl text-[18px] font-bold transition-all w-full flex items-center justify-between border cursor-pointer hover:shadow-md bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-200/55 dark:border-rose-900/40 hover:bg-rose-50/50 dark:hover:bg-rose-950/25 active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3.5">
                          <LogOut className="w-5.5 h-5.5 shrink-0 text-rose-500" />
                          <span>Sign Out</span>
                        </div>
                      </button>
                    ) : (
                      <div className="border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 rounded-2xl p-4.5 space-y-3.5 border-t border-slate-200 dark:border-slate-800/60 pt-6">
                        <p className="text-center font-bold text-[15px] text-rose-600 dark:text-rose-400">
                          Are you sure you want to sign out?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setMobileConfirmSignOut(false)}
                            className="py-3 px-4 rounded-xl text-xs font-extrabold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setMobileConfirmSignOut(false);
                              setMobileMenuOpen(false);
                              onLogout();
                            }}
                            className="py-3 px-4 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-md shadow-rose-600/15 cursor-pointer"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Exact aligned spacer on bottom to balance flex centering */}
              <div className="h-16 shrink-0" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}

function DarkMoonIcon() {
  return <Moon className="h-4.5 w-4.5 text-indigo-400 fill-indigo-400" />;
}
