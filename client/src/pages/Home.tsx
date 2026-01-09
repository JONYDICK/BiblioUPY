import { useLanguage } from "@/lib/i18n";
import { useResources } from "@/hooks/use-resources";
import { ResourceCard } from "@/components/ResourceCard";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { t } = useLanguage();
  const { data: resources, isLoading, error } = useResources();

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
      <section className="py-20 bg-black/20 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-2">
                {t("resources_title")}
              </h2>
              <div className="h-1 w-20 bg-primary rounded-full" />
            </div>
            {/* Can add filter controls here later */}
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
          ) : resources?.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
              <p className="text-white/40 text-lg">{t("resources_empty")}</p>
              <Link href="/upload" className="text-primary hover:underline mt-2 inline-block">
                Be the first to upload one!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {resources?.map((resource, index) => (
                <ResourceCard key={resource.id} resource={resource} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
