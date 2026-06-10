import { Sparkles, Trophy, ShieldCheck, Compass, Code, Lightbulb, ArrowRight, Target, Users, Landmark } from "lucide-react";

export function AboutTab() {
  const steps = [
    {
      icon: <Lightbulb className="w-6 h-6 text-emerald-600" />,
      title: "1. Post Operational Pain",
      desc: "Small business owners, local coordinators, or students share the micro-friction that slows them down—whether it is nested spreadsheet formulas, inventory slips, or coordination bottlenecks.",
    },
    {
      icon: <Code className="w-6 h-6 text-indigo-600" />,
      title: "2. Build Practical Utility",
      desc: "Developers select actual problems and construct working open-source applications, scripts, or chrome extensions. They escape the 'tutorial hell' of building redundant to-do lists.",
    },
    {
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
      title: "3. Gain Real-World Portfolios",
      desc: "Problem Sharers get free custom digital systems. Developers secure authentic projects with active user interactions, proving their capabilities immediately to tech employers.",
    },
  ];

  const values = [
    {
      icon: <Compass className="w-5 h-5 text-indigo-600" />,
      title: "Practical Over Academic",
      desc: "Stop cloning calculators. True engineering mastery comes from wrestling with shifting parameters, complex user scenarios, and real human requirements.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: "Radical Mutuality",
      desc: "We align developer ambition with consumer need. Problem Sharers get bespoke open-source assets for $0; developers harvest high-grade resume validation.",
    },
    {
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
      title: "Hiring Acceleration",
      desc: "Tech recruiters ignore simple classroom assignments. A Git repository demonstrating a solution designed for a real baker or local shelter lands interviews.",
    },
  ];  return (
    <div id="about-us-container" className="max-w-4xl mx-auto space-y-16 py-6 font-sans">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-full tracking-wider uppercase font-sans">
          Our Manifesto
        </span>
        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-5xl tracking-tight font-display bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-100 dark:via-indigo-300 dark:to-slate-100 bg-clip-text text-transparent">
          Turning Pain Into Projects, and Projects Into Careers.
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-sans leading-relaxed">
          This platform exists because real people live with real problems, and real developers need real problems to solve. Instead of building the same duplicate sandbox templates again and again, developers can work on meaningful project that matters to actual people.
        </p>
      </div>

      {/* Quote callout: The core thesis */}
      <div className="bg-gradient-to-br from-indigo-50/90 via-white to-emerald-50/50 dark:from-slate-900/90 dark:via-slate-950/80 dark:to-emerald-950/10 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl dark:shadow-2xl border-2 border-indigo-500/20 dark:border-indigo-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Quote symbol mark decorator */}
        <div className="absolute top-4 left-6 text-indigo-200/50 dark:text-indigo-850/30 text-8xl font-serif select-none pointer-events-none">
          “
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-450 rounded-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <span className="text-xs font-extrabold text-indigo-650 dark:text-indigo-350 uppercase tracking-widest font-mono">
              The Platform Creed & Mission
            </span>
          </div>

          <div className="space-y-4 border-l-4 border-indigo-600 dark:border-indigo-500 pl-6 md:pl-8">
            <p className="font-display text-base md:text-[18px] text-slate-800 dark:text-slate-100 font-medium leading-relaxed tracking-wide">
              New developers often only create <strong className="text-indigo-700 dark:text-indigo-400 font-extrabold font-mono">to-do list, calculator and weather app projects</strong> and when they go for interviews in companies, the companies are not impressed with all these projects they see. They want new ideas and interesting projects.
            </p>
            <p className="font-display text-base md:text-[18px] text-slate-800 dark:text-slate-100 font-medium leading-relaxed tracking-wide">
              Sometimes a project can be very interesting and very brilliant, but it does not solve any real problem in the real world or reality. <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">So this website is for them.</strong>
            </p>
            <p className="font-display text-base md:text-[18px] text-slate-800 dark:text-slate-100 font-medium leading-relaxed tracking-wide">
              Here, some people will share their problems. And developers, especially beginners, will <strong className="text-indigo-650 dark:text-indigo-400 underline decoration-indigo-400/40 decoration-wavy">create tools, websites or softwares or any projects to solve their problems for free.</strong> Thus, they can help people and they themselves can create an interesting and new brilliant project that can solve real world problems. This will also help them to build strong portfolio in LinkedIn.
            </p>
          </div>

          <div className="pt-5 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-1 bg-indigo-600 dark:bg-indigo-500 w-12 rounded-full"></div>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-widest font-mono">Platform Creed</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold font-mono">
              <span>● ACTIVE COOPERATION MODEL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Process Flow */}
      <div className="glass-panel-premium rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-100 mb-8 font-display flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          The Mutuality Framework
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 w-fit rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 transition-colors">
                {step.icon}
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-200 text-lg font-display">{step.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{step.desc}</p>
              {index < 2 && (
                <div className="hidden md:block absolute top-6 -right-4 translate-x-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Mission and Vision */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card-premium rounded-3xl p-8 space-y-4">
          <span className="text-indigo-650 dark:text-indigo-450 text-xs font-mono tracking-widest uppercase font-bold">For Problem Sharers</span>
          <h3 className="text-2xl font-bold font-display text-slate-950 dark:text-white">Bespoke Automated Solutions</h3>
          <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-sans">
            You don't need a heavy agency contract or capital to digitize your small operations. Whether you are a local non-profit mapping food distribution or an organic baker tracking wastage, our developers build functional plugins, Web apps, or local scripts tailored uniquely for you.
          </p>
        </div>
        <div className="glass-card-premium rounded-3xl p-8 space-y-4">
          <span className="text-indigo-650 dark:text-indigo-400 text-xs font-mono tracking-widest uppercase font-bold">For Beginner Developers</span>
          <h3 className="text-2xl font-bold font-display text-indigo-950 dark:text-white">Break Out of Tutorial Hell</h3>
          <p className="sky-slate-900/80 dark:text-indigo-200 text-xs leading-relaxed font-sans">
            Recruiters know how to spot boot-camp templates from a mile away. Stand out by proving you have solved a real bottleneck for a live user. Negotiate specifications, deliver working software, deploy preview links, and assemble a portfolio with genuine business utility.
          </p>
        </div>
      </div>

      {/* Core Values */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-100 text-center font-display">How We Scale Growth</h3>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          Through deliberate open collaboration, we seek to accumulate a public registry of solved human complications.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((v, index) => (
            <div key={index} className="bg-white/75 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/40 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-3 hover:border-indigo-200/50 dark:hover:border-indigo-900/60 transition-all duration-200">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 w-fit rounded-lg">{v.icon}</div>
              <h4 className="font-bold text-slate-900 dark:text-slate-200 text-sm font-display">{v.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
