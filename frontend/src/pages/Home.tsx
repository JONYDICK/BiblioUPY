import { useLanguage } from "@/lib/i18n";
import { useResources, useCategoriesWithCounts, useCareersWithCounts, useResourceTypeCounts } from "@/hooks/use-resources";
import { ResourceCard } from "@/components/ResourceCard";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, Loader2, Book, GraduationCap, FileText, Video, Cpu, Shield, Database, Cog, TrendingUp, LogIn, UserPlus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [location, setLocation] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const urlSearch = urlParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [careerFilter, setCareerFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const { data: user } = useQuery<{ id: number } | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const handleShareClick = () => {
    if (user) {
      setLocation("/upload");
    } else {
      setShowAuthDialog(true);
    }
  };

  // Sync search query with URL params
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

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

  // Resources are already filtered by the API - use them directly
  const filteredResources = resources;

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
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white gap-2" onClick={handleShareClick}>
              Compartir Recurso
              <ArrowRight className="w-4 h-4" />
            </Button>
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
                <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={handleShareClick}>
                  Subir Recurso
                </Button>
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
          <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-8" onClick={handleShareClick}>
            Compartir Recurso
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Inicia sesión para compartir</DialogTitle>
            <DialogDescription className="text-center">
              Para subir y compartir recursos necesitas una cuenta en BiblioUPY.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Link href="/login">
              <Button className="w-full gap-2" onClick={() => setShowAuthDialog(false)}>
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowAuthDialog(false)}>
                <UserPlus className="w-4 h-4" />
                Crear Cuenta
              </Button>
            </Link>
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">o continúa con</span>
              </div>
            </div>
            <a
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              onClick={() => setShowAuthDialog(false)}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.27498 6.60986C0.46498 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46498 15.7699 1.28498 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
              </svg>
              Continuar con Google
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
