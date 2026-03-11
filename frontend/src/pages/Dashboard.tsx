import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStats } from "@/hooks/use-resources";
import { motion } from "framer-motion";
import {
  BookOpen, FileText, Heart, Download, Eye, Upload, User,
  Bell, Settings, LogOut, Shield, TrendingUp, Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  roles?: string[];
  permissions?: string[];
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("No autenticado");
      return res.json();
    },
    retry: false,
  });

  // Fetch user's favorites
  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites", { credentials: "include" });
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch user stats from API (real data)
  const { data: userStatsData } = useUserStats();

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?unreadOnly=true", { credentials: "include" });
      return res.json();
    },
    enabled: !!user,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Error al cerrar sesión");
      return res.json();
    },
    onSuccess: () => {
      localStorage.removeItem("user");
      queryClient.clear();
      navigate("/login");
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (userError) {
      navigate("/login");
    }
  }, [userError, navigate]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Stats from real API data
  const stats = [
    { icon: FileText, label: "Recursos subidos", value: userStatsData?.stats.totalResources ?? 0, color: "text-primary", bg: "bg-primary/10" },
    { icon: Heart, label: "Favoritos", value: userStatsData?.stats.totalFavorites ?? 0, color: "text-red-600", bg: "bg-red-100" },
    { icon: Download, label: "Descargas", value: userStatsData?.stats.totalDownloads ?? 0, color: "text-green-600", bg: "bg-green-100" },
    { icon: Eye, label: "Vistas totales", value: userStatsData?.stats.totalViews ?? 0, color: "text-secondary", bg: "bg-secondary/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo_upy.png" alt="UPY" className="h-10 w-auto" />
            <span className="text-xl font-bold text-gray-900">BiblioUPY</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>

            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="bg-primary text-white">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => logoutMutation.mutate()}
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            ¡Hola, {user.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido a tu panel de control
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle>Acciones rápidas</CardTitle>
                <CardDescription>
                  Accede rápidamente a las funciones principales
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/upload">
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <Upload className="w-6 h-6 text-blue-600" />
                    <span>Subir recurso</span>
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <BookOpen className="w-6 h-6 text-green-600" />
                    <span>Explorar</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <User className="w-6 h-6 text-purple-600" />
                    <span>Mi perfil</span>
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <Settings className="w-6 h-6 text-gray-600" />
                    <span>Ajustes</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Autenticación MFA</span>
                  {user.mfaEnabled ? (
                    <Badge variant="default" className="bg-green-600">Activo</Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Email verificado</span>
                  <Badge variant="default" className="bg-green-600">Sí</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Rol</span>
                  <Badge variant="secondary">{user.roles?.[0] || "student"}</Badge>
                </div>
                
                {!user.mfaEnabled && (
                  <Link href="/settings/security">
                    <Button variant="outline" className="w-full mt-2">
                      Activar MFA
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent favorites */}
        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Favoritos recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.slice(0, 3).map((resource: any) => (
                    <Link key={resource.id} href={`/resources/${resource.id}`}>
                      <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <h3 className="font-medium text-gray-900 truncate">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {resource.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye size={12} /> {resource.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download size={12} /> {resource.downloadCount}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
