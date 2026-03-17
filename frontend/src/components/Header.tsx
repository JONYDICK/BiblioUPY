import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Menu, X, Globe, LogIn, UserPlus, User, Search, ChevronDown, Book, FileText, GraduationCap, Users, HelpCircle, MessageSquare } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user, isLoading } = useQuery<User | null>({
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
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search
    console.log("Searching:", searchQuery);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white shadow-sm border-b border-gray-100">
      {/* Top bar with contact info */}
      <div className="bg-primary text-white text-xs py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <span>Universidad Politécnica de Yucatán — Juntos creamos el Futuro</span>
          <div className="flex items-center gap-4">
            <span>📞 999 151 1791</span>
            <span>✉️ contacto@upy.edu.mx</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo_upy.png" alt="UPY" className="h-12 w-auto" />
            <div className="hidden sm:block border-l border-gray-200 pl-3">
              <span className="block font-display font-bold text-primary text-lg leading-tight">BiblioUPY</span>
              <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Biblioteca Digital</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/">
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${location === "/" ? "text-primary bg-primary/5" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`}>
                      Inicio
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium text-gray-700 hover:text-primary">
                    Acervo
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-64 p-3 space-y-1">
                      <Link href="/?filter=books" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700 hover:text-primary">
                        <Book className="w-4 h-4" />
                        Libros Digitales
                      </Link>
                      <Link href="/?filter=thesis" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700 hover:text-primary">
                        <GraduationCap className="w-4 h-4" />
                        Tesis
                      </Link>
                      <Link href="/?filter=articles" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700 hover:text-primary">
                        <FileText className="w-4 h-4" />
                        Artículos y Revistas
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium text-gray-700 hover:text-primary">
                    Comunidad
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-64 p-3 space-y-1">
                      <Link href="/forum" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700 hover:text-primary">
                        <MessageSquare className="w-4 h-4" />
                        Foro de Discusión
                      </Link>
                      <Link href="/upload" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 text-sm text-gray-700 hover:text-primary">
                        <Users className="w-4 h-4" />
                        Compartir Recursos
                      </Link>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/help">
                    <NavigationMenuLink className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors flex items-center gap-1">
                      <HelpCircle className="w-4 h-4" />
                      Ayuda
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar recursos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-full border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-primary"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </form>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {language.toUpperCase()}
            </button>

            {!isLoading && (
              <>
                {user ? (
                  <Link href="/profile">
                    <Button variant="ghost" className="text-gray-700 hover:text-primary hover:bg-gray-50 gap-2">
                      <User className="w-4 h-4" />
                      {user.firstName}
                    </Button>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login">
                      <Button variant="ghost" className="text-gray-700 hover:text-primary hover:bg-gray-50 gap-2">
                        <LogIn className="w-4 h-4" />
                        Entrar
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2">
                        <UserPlus className="w-4 h-4" />
                        Registrarse
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-primary transition-colors p-2"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Buscar recursos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-200 bg-gray-50"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </form>

              <Link href="/" className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Inicio
              </Link>
              <Link href="/forum" className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Foro
              </Link>
              <Link href="/upload" className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Compartir Recursos
              </Link>
              
              <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                {!isLoading && !user && (
                  <>
                    <Link href="/login" className="block px-4 py-3 rounded-lg text-primary font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                      Iniciar Sesión
                    </Link>
                    <Link href="/register" className="block px-4 py-3 rounded-lg bg-secondary text-white font-medium text-center" onClick={() => setIsMobileMenuOpen(false)}>
                      Registrarse
                    </Link>
                  </>
                )}
                {user && (
                  <Link href="/profile" className="block px-4 py-3 rounded-lg text-primary font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                    Mi Cuenta ({user.firstName})
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}