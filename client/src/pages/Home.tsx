import { useLanguage } from "@/lib/i18n";
import { useResources } from "@/hooks/use-resources";
import { ResourceCard } from "@/components/ResourceCard";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Loader2, Filter } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const { t } = useLanguage();
  const { data: resources, isLoading, error } = useResources();

  const [careerFilter, setCareerFilter] = useState("all");
  const [purposeFilter, setPurposeFilter] = useState("all");

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    return resources.filter(r => {
      const matchCareer = careerFilter === "all" || r.career.toLowerCase().includes(careerFilter.toLowerCase());
      const matchPurpose = purposeFilter === "all" || r.purpose.toLowerCase().includes(purposeFilter.toLowerCase());
      return matchCareer && matchPurpose;
    });
  }, [resources, careerFilter, purposeFilter]);

  return (
    <main className="min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs md:text-sm font-medium tracking-wide text-white/90">
                BiblioUPY Prototype v1.0
              </span>
            </div>
            
            <h1 className="font-display font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6">
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                {t("hero_title").split(" ").slice(0, -1).join(" ")}
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-200">
                {t("hero_title").split(" ").slice(-1)}
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-white/60 max-w-2xl mx-auto mb-10 font-light">
              {t("hero_subtitle")}
            </p>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/upload"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-background font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,215,0,0.5)] hover:shadow-[0_0_60px_-15px_rgba(255,215,0,0.7)] transition-shadow duration-300"
              >
                {t("hero_cta")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* RESOURCES SECTION */}
      <section className="py-20 bg-background border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-12">
            
            {/* LEFT SIDEBAR FILTERS */}
            <aside className="w-full md:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-8">
                <div>
                  <h2 className="font-display font-bold text-2xl text-white mb-6 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    {t("nav_library")}
                  </h2>
                  <div className="h-1 w-12 bg-primary rounded-full mb-8" />
                </div>

                {/* Career Filter */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-2">
                    {t("filter_career")}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {[
                      { id: "all", label: t("career_all") },
                      { id: "cybersecurity", label: t("career_cybersecurity") },
                      { id: "robotics", label: t("career_robotics") },
                      { id: "data", label: t("career_data") },
                      { id: "embedded", label: t("career_embedded") }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setCareerFilter(opt.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                          careerFilter === opt.id 
                            ? "bg-primary text-background shadow-lg shadow-primary/20" 
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose Filter */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-2">
                    {t("filter_purpose")}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {[
                      { id: "all", label: t("purpose_all") },
                      { id: "research", label: t("purpose_research") },
                      { id: "textbook", label: t("purpose_textbook") },
                      { id: "reference", label: t("purpose_reference") }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPurposeFilter(opt.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                          purposeFilter === opt.id 
                            ? "bg-primary text-background shadow-lg shadow-primary/20" 
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(careerFilter !== "all" || purposeFilter !== "all") && (
                  <button 
                    onClick={() => {setCareerFilter("all"); setPurposeFilter("all")}}
                    className="w-full py-3 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white hover:border-white/20 transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1">
              <div className="mb-8 flex justify-between items-center">
                <p className="text-white/40 text-sm">
                  Showing <span className="text-white font-bold">{filteredResources.length}</span> resources
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <span className="ml-3 text-white/50">{t("resources_loading")}</span>
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <p className="text-red-300">Error loading resources. Please try again later.</p>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                  <p className="text-white/40 text-lg">{t("resources_empty")}</p>
                </div>
              ) : (
                <motion.div 
                  layout
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredResources.map((resource, index) => (
                      <ResourceCard key={resource.id} resource={resource} index={index} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
