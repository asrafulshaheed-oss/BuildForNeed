import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, Globe, Share2, ExternalLink, Heart, MessageSquare, Award, Sparkles, BookOpen } from "lucide-react";
import { Post } from "../types";

interface SharePreviewModalProps {
  post: Post;
  onClose: () => void;
  showToast: (msg: string) => void;
}

type PlatformTab = "twitter" | "facebook" | "linkedin";

export function SharePreviewModal({ post, onClose, showToast }: SharePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<PlatformTab>("twitter");
  const [copied, setCopied] = useState(false);

  const permalink = `${window.location.origin}${window.location.pathname}?post=${post.id}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(permalink);
      } else {
        // Fallback for older frames
        const textArea = document.createElement("textarea");
        textArea.value = permalink;
        textArea.style.position = "absolute";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNativeShare = async (platform: string) => {
    const text = encodeURIComponent(`Check out this problem on Build For Need: "${post.title}"`);
    const url = encodeURIComponent(permalink);
    
    let shareUrl = "";
    if (platform === "twitter") {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    } else if (platform === "facebook") {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === "linkedin") {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200"
      id="share-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl overflow-hidden focus:outline-hidden"
        id="share-modal-container"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Share2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
                Share dilemma & preview card
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Generate high-fidelity cards optimized for platform social networks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display platform tabs */}
        <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 dark:bg-slate-950/60 rounded-xl mb-6">
          {(["twitter", "facebook", "linkedin"] as PlatformTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-[11px] font-bold uppercase tracking-wider py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab === "twitter" ? "Twitter / X Post" : tab === "facebook" ? "Facebook Post" : "LinkedIn Post"}
            </button>
          ))}
        </div>

        {/* Simulated Platform Box */}
        <div className="border border-slate-150 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 p-4 md:p-6 mb-6">
          {/* Twitter / X simulated feed */}
          {activeTab === "twitter" && (
            <div className="space-y-3.5 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-extrabold text-white text-sm tracking-wider">
                  BFN
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">Build For Need</span>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-extrabold px-1 rounded">✓ Shared</span>
                  </div>
                  <p className="text-[11px] text-slate-400">@buildforneed · 2m</p>
                </div>
              </div>

              <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-xs leading-relaxed font-normal">
                Can anyone help resolve this community manual bottleneck? Let's pair up to write suggestions! 🙌 <span className="text-indigo-500">#BuildForNeed</span> <span className="text-indigo-550">#CodeForGood</span> <span className="text-indigo-500">#OSS</span>
              </p>

              {/* Simulated OpenGraph Image Card */}
              <div className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden hover:opacity-95 transition-opacity cursor-pointer">
                {/* Simulated generated visual image block with gorgeous visual styling */}
                <div className="h-44 bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 p-6 flex flex-col justify-between relative overflow-hidden">
                  {/* Subtle matrix dots overlay */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                  
                  <div className="flex items-start justify-between z-10">
                    <span className="bg-indigo-500/15 border border-indigo-400/25 text-white text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md backdrop-blur-md">
                      {post.category}
                    </span>
                    <span className="text-[9px] text-indigo-300 font-mono tracking-wider">buildforneed.community</span>
                  </div>

                  <div className="space-y-1.5 z-10">
                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug tracking-tight line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[10px] text-indigo-200/90 leading-normal line-clamp-2">
                      {post.description}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-850">
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">BUILDFORNEED.COMMUNITY</span>
                  <p className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">{post.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{post.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Facebook simulated feed */}
          {activeTab === "facebook" && (
            <div className="space-y-3.5 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white text-xs">
                  BFN
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">Build For Need</span>
                    <span className="text-slate-400 text-xs">is sharing a problem.</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Just now</span>
                    <span>·</span>
                    <Globe className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                Operators and manual problem solvers have listed a new friction dilemma on our community wall. Read their full brief and add suggestions, repositories, or outlines!
              </p>

              {/* Feed Preview card link */}
              <div className="border border-slate-220 dark:border-slate-800 overflow-hidden rounded-md cursor-pointer hover:opacity-95 transition-all">
                <div className="h-40 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 flex flex-col justify-end relative">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                  <div className="z-10 bg-black/35 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
                    <span className="text-[8px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.2 rounded uppercase tracking-wider font-extrabold">{post.category}</span>
                    <h4 className="font-black text-xs sm:text-sm text-white tracking-tight mt-1 truncate">{post.title}</h4>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-100 dark:bg-slate-900 flex items-center justify-between border-t border-slate-205 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 tracking-wider">BUILDFORNEED.COMMUNITY</span>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">{post.title}</h5>
                  </div>
                  <button className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-220 text-slate-705 dark:text-slate-300 rounded font-bold text-xs">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LinkedIn simulated feed */}
          {activeTab === "linkedin" && (
            <div className="space-y-3.5 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-900 flex items-center justify-center font-extrabold text-xs">
                  BFN
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">Build For Need Community</span>
                    <span className="text-[10px] text-slate-400 font-bold">· 1st</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Open-Source Collaboration Catalyst</p>
                  <p className="text-[10px] text-slate-400">Just now · <Globe className="w-2.5 h-2.5 inline-block text-slate-400 align-baseline" /></p>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                We are excited to share a new operator pain point registered on the Build For Need platform. Great project opportunity for portfolio builders seeking real-world software exposure.
              </p>

              {/* LinkedIn OG Card */}
              <div className="border border-slate-200 dark:border-slate-850 rounded-lg overflow-hidden bg-white dark:bg-slate-900 cursor-pointer">
                <div className="h-44 bg-gradient-to-tr from-violet-900 to-indigo-950 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Award className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[9px] font-black text-indigo-200 tracking-wider font-mono">PROBLEM OF THE DAY</span>
                    </div>
                    <span className="text-[9px] uppercase bg-white/10 text-white font-extrabold px-1.5 py-0.2 rounded">{post.category}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug line-clamp-2">{post.title}</h3>
                    <p className="text-[10px] text-indigo-150 line-clamp-2 leading-relaxed">{post.description}</p>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/20">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{post.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">buildforneed.community · 3 min read</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Panel Links */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Permalink Input Box */}
            <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-850">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                readOnly
                value={permalink}
                className="flex-1 bg-transparent border-none text-xs text-slate-600 dark:text-slate-400 focus:outline-none select-all truncate"
              />
            </div>
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`py-3 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-550 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-3.5 pt-4 border-t border-slate-150 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Share Directly To:</span>
            <button
              onClick={() => handleNativeShare("twitter")}
              className="p-2 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Twitter / X</span>
            </button>
            <button
              onClick={() => handleNativeShare("facebook")}
              className="p-2 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Facebook</span>
            </button>
            <button
              onClick={() => handleNativeShare("linkedin")}
              className="p-2 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>LinkedIn</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
