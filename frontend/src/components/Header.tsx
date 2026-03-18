import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Menu, X, LogIn, UserPlus, User, ChevronDown, Book, FileText, GraduationCap, Users, LogOut, Upload } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        // Invalidate user query
        queryClient.invalidateQueries({ queryKey: ["me"] });

        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente",
        });

        // Redirect to home
        window.location.href = "/";
      } else {
        toast({
          title: "Error",
          description: "No se pudo cerrar la sesión",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al cerrar la sesión",
        variant: "destructive",
      });
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowAuthDialog(true);
    }
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
                  <Link href="/upload" onClick={handleShareClick}>
                    <NavigationMenuLink className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${location === "/upload" ? "text-primary bg-primary/5" : "text-gray-700 hover:text-primary hover:bg-gray-50"}`}>
                      <Upload className="w-4 h-4" />
                      Compartir
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-2">

            {!isLoading && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      {user.firstName}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* User Dropdown Menu */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                        >
                          <Link href="/profile" className="block" onClick={() => setIsUserMenuOpen(false)}>
                            <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                              <User className="w-4 h-4" />
                              Ver Perfil
                            </button>
                          </Link>
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-100"
                          >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
              <Link href="/" className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Inicio
              </Link>
              <Link href={user ? "/upload" : "#"} className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 font-medium" onClick={(e) => { if (!user) { e.preventDefault(); setShowAuthDialog(true); } setIsMobileMenuOpen(false); }}>
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
                  <>
                    <Link href="/profile" className="block px-4 py-3 rounded-lg text-primary font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                      Mi Cuenta ({user.firstName})
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg text-red-600 font-medium flex items-center gap-2 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Dialog for unauthenticated users trying to share */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Inicia sesión para compartir</DialogTitle>
            <DialogDescription className="text-center">
              Para subir y compartir recursos necesitas una cuenta en BiblioUPY.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Link href="/login" onClick={() => setShowAuthDialog(false)}>
              <Button className="w-full gap-2" variant="default">
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register" onClick={() => setShowAuthDialog(false)}>
              <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-white">
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
    </header>
  );
}