import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  MessageSquare, ArrowLeft, Plus, Pin, Lock, Eye, Clock, 
  ChevronRight, User 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Thread {
  id: number;
  title: string;
  slug: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: string;
  lastReplyAt: string;
  author: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
}

export default function ForumThreads() {
  const params = useParams<{ categorySlug: string }>();
  const categorySlug = params.categorySlug;

  const { data, isLoading } = useQuery<{ threads: Thread[] }>({
    queryKey: ["forum-threads", categorySlug],
    queryFn: async () => {
      // Placeholder - in real app would use categorySlug to fetch
      const res = await fetch(`/api/forum/categories/1/threads`);
      if (!res.ok) throw new Error("Error loading threads");
      return { threads: await res.json() };
    },
  });

  // Demo threads if API returns empty
  const demoThreads: Thread[] = [
    {
      id: 1,
      title: "Bienvenidos al foro de BiblioUPY",
      slug: "bienvenidos-al-foro",
      content: "Este es el lugar para discutir sobre la biblioteca digital.",
      isPinned: true,
      isLocked: false,
      viewCount: 234,
      replyCount: 12,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastReplyAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      author: { id: 1, username: "admin" },
    },
    {
      id: 2,
      title: "¿Cómo puedo subir un PDF?",
      slug: "como-subir-pdf",
      content: "Tengo dudas sobre el proceso de subir archivos.",
      isPinned: false,
      isLocked: false,
      viewCount: 89,
      replyCount: 5,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastReplyAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      author: { id: 2, username: "estudiante1" },
    },
    {
      id: 3,
      title: "Recomendaciones de libros de programación",
      slug: "recomendaciones-programacion",
      content: "Busco libros para aprender Python y JavaScript.",
      isPinned: false,
      isLocked: false,
      viewCount: 156,
      replyCount: 23,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastReplyAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      author: { id: 3, username: "devlover" },
    },
  ];

  const threads = data?.threads && data.threads.length > 0 ? data.threads : demoThreads;

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return "hace un momento";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/forum" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <ArrowLeft size={16} />
            Volver al foro
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {categorySlug?.replace(/-/g, " ") || "Categoría"}
              </h1>
              <p className="text-gray-500 mt-1">
                {threads.length} temas en esta categoría
              </p>
            </div>
            <Link href={`/forum/category/${categorySlug}/new`}>
              <Button className="gap-2">
                <Plus size={18} />
                Nuevo tema
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Threads list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardContent>
              </Card>
            ))
          ) : (
            threads.map((thread, index) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Link href={`/forum/thread/${thread.slug}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={thread.author.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {thread.author.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {thread.isPinned && (
                            <Pin size={14} className="text-orange-500" />
                          )}
                          {thread.isLocked && (
                            <Lock size={14} className="text-gray-400" />
                          )}
                          <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors truncate">
                            {thread.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {thread.author.username}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(thread.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{thread.replyCount}</p>
                          <p className="text-xs">respuestas</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{thread.viewCount}</p>
                          <p className="text-xs">vistas</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
