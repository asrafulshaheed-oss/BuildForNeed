import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, MessageSquare, Code, Shield } from "lucide-react";

export function FaqTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      icon: <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      question: "Is this service really free?",
      answer: "Yes, 100% free. Problem Sharers submit operational pain lines, and software developers build open-source scripts, extensions, or websites to solve them. Developers gain portfolio weight, and operators get bespoke utility tooling without agency costs.",
    },
    {
      icon: <Code className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      question: "Why would developers write software for free?",
      answer: "Traditional side-projects like clones or calculators do not impress tech employers. By resolving a real business coordination problem for a live, active user, developers build rich portfolios in GitHub/LinkedIn, demonstrating genuine product-oriented capabilities.",
    },
    {
      icon: <Shield className="w-5 h-5 text-amber-500 shadow-xs" />,
      question: "Who owns the code or repositories?",
      answer: "All projects, software proposals, and comments published are open source under permissive licenses (e.g., MIT). Developers supply direct, public GitHub repository links so peer programmers and sharers can clone, test, or deploy the code freely.",
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
      question: "What are difficulty and comment utility ratings?",
      answer: "To establish a high-trust network, only Developers can rate problem difficulty (1-5 difficulty index). Conversely, only Problem Sharers can rate developer comments (1-3 stars) to determine utility. Average scores are listed publicly on posts and profiles.",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />,
      question: "Can I post a problem anonymously?",
      answer: "Absolutely. When making a problem post, you can toggle 'Anonymous Submission' to keep your identity concealed from the public backlog while still collecting valuable developer suggestions and solution plans.",
    },
  ];

  return (
    <div id="faq-view-container" className="max-w-3xl mx-auto space-y-10 py-6 font-sans">
      {/* Header Info */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-full tracking-wider uppercase">
          Inquiries & Guides
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-indigo-200 bg-clip-text text-transparent">
          Frequently Answered Bottlenecks
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          Unlock answers to our platform model, rating policies, repository safety standards, and user permissions.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="glass-card-premium rounded-2xl overflow-hidden transition-all duration-300 hover:border-indigo-500/25 dark:hover:border-indigo-500/25"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left gap-4 font-sans focus:outline-hidden cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl">
                    {faq.icon}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {faq.question}
                  </span>
                </div>
                <div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
              </button>

              <div
                className={`transition-all duration-350 ease-in-out ${
                  isOpen ? "max-h-60 border-t border-slate-100 dark:border-slate-800" : "max-h-0"
                } overflow-hidden`}
              >
                <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-950/20 text-xs sm:text-[13px] text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
