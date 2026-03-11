import { useLanguage } from "@/lib/i18n";
import { useResources, useCategoriesWithCounts, useCareersWithCounts, useResourceTypeCounts } from "@/hooks/use-resources";
import { ResourceCard } from "@/components/ResourceCard";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, Loader2, Book, GraduationCap, FileText, Video, Cpu, Shield, Database, Cog, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

// Icon mapping for categories
const categoryIcons: Record<string, React.ElementType> = {
  books: Book,
  libros: Book,
  tesis: GraduationCap,
  thesis: GraduationCap,
  articles: FileText,
  articulos: FileText,
  videos: Video,
  software: Cpu,
  documentos: FileText,
};

// Color mapping for categories
const categoryColors: Record<string, string> = {
  books: "bg-blue-500",
  libros: "bg-blue-500",
  tesis: "bg-purple-500",
  thesis: "bg-purple-500",
  articles: "bg-green-500",
  articulos: "bg-green-500",
  videos: "bg-red-500",
  software: "bg-cyan-500",
  documentos: "bg-gray-500",
};

// Career icon mapping
const careerIcons: Record<string, React.ElementType> = {
  ciberseguridad: Shield,
  ics: Shield,
  robotica: Cog,
  iro: Cog,
  datos: Database,
  icd: Database,
  embebidos: Cpu,
  ise: Cpu,
};

export default function Home() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [careerFilter, setCareerFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch data from API
  const { data: resourcesData, isLoading: resourcesLoading } = useResources({
    careerId: careerFilter || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    search: searchQuery || undefined,
    limit: 50,
  });

  const { data: categoriesData } = useCategoriesWithCounts();
  const { data: careersData } = useCareersWithCounts();
  const { data: typeCounts } = useResourceTypeCounts();

  // Calculate totals
  const totalResources = resourcesData?.total || 0;
  const resources = resourcesData?.resources || [];

  // Filter resources by search (client side for instant feedback)
  const filteredResources = useMemo(() => {
    if (!searchQuery) return resources;
    const query = searchQuery.toLowerCase();
    return resources.filter(r => 
      r.title.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query) ||
      r.author?.toLowerCase().includes(query)
    );
  }, [resources, searchQuery]);

  // Get count for a type
  const getTypeCount = (type: string) => {
    if (!typeCounts) return 0;
    const found = typeCounts.find(t => t.type?.toLowerCase() === type.toLowerCase());
    return found?.count || 0;
  };

  // Default categories if API hasn't loaded yet
  const displayCategories = categoriesData?.length ? categoriesData : [
    { id: 1, name: "Libros", slug: "libros", resourceCount: getTypeCount("libro") },
    { id: 2, name: "Tesis", slug: "tesis", resourceCount: getTypeCount("tesis") },
    { id: 3, name: "Artículos", slug: "articulos", resourceCount: getTypeCount("articulo") },
    { id: 4, name: "Videos", slug: "videos", resourceCount: getTypeCount("video") },
  ];

  return (
    <main className="min-h-screen bg-background">
      
      {/* HERO SECTION - Dark dramatic style */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden bg-[#0d0d0d]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0d0d0d]/50" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-white/90 text-sm font-medium">
                {totalResources} recursos disponibles
              </span>
            </div>
            
            <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl tracking-tight mb-4">
              <span className="text-white">BIBLIOTECA</span>
              <br />
              <span className="text-secondary">DIGITAL UPY</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Accede a recursos académicos compartidos por la comunidad universitaria.
              Libros, tesis, artículos y más.
            </p>

            <Link href="/register">
              <Button className="bg-secondary hover:bg-secondary/90 text-black font-bold px-8 py-6 text-lg rounded-full shadow-lg shadow-secondary/25 transition-all hover:scale-105">
                ÚNETE AHORA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-10 bg-gray-50 border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 bg-white rounded-lg p-2 shadow-md border border-gray-200">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar libros, tesis, artículos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-0 text-gray-900 text-base focus:ring-0 bg-transparent"
              />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-base font-semibold">
              Buscar
            </Button>
          </form>
        </div>
      </section>

      {/* CATEGORY CARDS - Dynamic from API */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayCategories.slice(0, 4).map((cat, idx) => {
              const slug = cat.slug?.toLowerCase() || cat.name.toLowerCase();
              const IconComponent = categoryIcons[slug] || FileText;
              const colorClass = categoryColors[slug] || "bg-primary";
              
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-gray-100 hover:border-primary/20"
                    onClick={() => setTypeFilter(slug === typeFilter ? "all" : slug)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 ${colorClass} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
                      <p className="text-sm text-gray-500">{cat.resourceCount} recursos</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CAREERS FILTER TABS - Dynamic from API */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1 py-4 scrollbar-hide">
            <button
              onClick={() => setCareerFilter(null)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                careerFilter === null
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Book className="w-4 h-4" />
              Todas las Carreras
            </button>
            {careersData?.map((career) => {
              const code = career.code?.toLowerCase() || "";
              const IconComponent = careerIcons[code] || GraduationCap;
              
              return (
                <button
                  key={career.id}
                  onClick={() => setCareerFilter(career.id === careerFilter ? null : career.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                    careerFilter === career.id
                      ? "bg-primary text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {career.name.replace("Ingeniería en ", "")}
                  <span className="text-xs opacity-70">({career.resourceCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* RESOURCES GRID */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recursos Disponibles</h2>
              <p className="text-gray-500 mt-1">
                Mostrando <span className="font-semibold text-primary">{filteredResources.length}</span> de {totalResources} recursos
              </p>
            </div>
            <Link href="/upload">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white gap-2">
                Compartir Recurso
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {resourcesLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <span className="ml-3 text-gray-500">{t("resources_loading")}</span>
            </div>
          ) : filteredResources.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 bg-white">
              <CardContent className="py-16 text-center">
                <Book className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{t("resources_empty")}</p>
                <p className="text-gray-400 text-sm mt-2">Sé el primero en compartir un recurso</p>
                <Link href="/upload">
                  <Button className="mt-4 bg-primary hover:bg-primary/90">
                    Subir Recurso
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredResources.map((resource, index) => (
                  <ResourceCard key={resource.id} resource={resource} index={index} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            ¿Tienes material que compartir?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Contribuye a la comunidad UPY compartiendo tus apuntes, libros y recursos académicos con otros estudiantes.
          </p>
          <Link href="/upload">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-8">
              Compartir Recurso
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

    </main>
  );
}
