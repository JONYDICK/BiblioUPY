import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Flag, Share2,
  Send, Clock, Eye, Pin, Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Post {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
}

interface Thread {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: string;
  authorId: number;
}

export default function ForumThread() {
  const params = useParams<{ threadSlug: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState("");

  const { data, isLoading } = useQuery<{ thread: Thread; posts: Post[] }>({
    queryKey: ["forum-thread", params.threadSlug],
    queryFn: async () => {
      // In real app, would look up thread by slug
      const res = await fetch(`/api/forum/threads/1`);
      if (!res.ok) throw new Error("Error loading thread");
      return res.json();
    },
  });

  // Demo data
  const demoThread: Thread = {
    id: 1,
    title: "Bienvenidos al foro de BiblioUPY",
    content: `¡Hola a todos!

Este es el nuevo foro de la comunidad BiblioUPY. Aquí podrán:

- Hacer preguntas sobre el uso de la biblioteca
- Compartir recursos y recomendaciones
- Discutir sobre temas académicos
- Proponer mejoras para la plataforma

Les pedimos que mantengan un ambiente de respeto y colaboración.

¡Bienvenidos!`,
    isPinned: true,
    isLocked: false,
    viewCount: 234,
    replyCount: 3,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    authorId: 1,
  };

  const demoPosts: Post[] = [
    {
      id: 1,
      content: "¡Excelente iniciativa! Me alegra ver este espacio para la comunidad.",
      upvotes: 5,
      downvotes: 0,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      author: { id: 2, username: "maria_dev" },
    },
    {
      id: 2,
      content: "¿Cómo puedo cambiar mi foto de perfil? No encuentro la opción.",
      upvotes: 2,
      downvotes: 0,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      author: { id: 3, username: "carlos99" },
    },
    {
      id: 3,
      content: "@carlos99 Ve a Configuración > Perfil y ahí puedes cambiar tu avatar. También puedes usar Gravatar.",
      upvotes: 3,
      downvotes: 0,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      author: { id: 1, username: "admin" },
    },
  ];

  const thread = data?.thread || demoThread;
  const posts = data?.posts || demoPosts;

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/forum/threads/${thread.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Error al enviar respuesta");
      return res.json();
    },
    onSuccess: () => {
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["forum-thread", params.threadSlug] });
      toast({ title: "Respuesta enviada", description: "Tu respuesta ha sido publicada" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Debes iniciar sesión para responder", 
        variant: "destructive" 
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ postId, voteType }: { postId: number; voteType: "up" | "down" }) => {
      const res = await fetch(`/api/forum/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ voteType }),
      });
      if (!res.ok) throw new Error("Error al votar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-thread", params.threadSlug] });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Debes iniciar sesión para votar", 
        variant: "destructive" 
      });
    },
  });

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return "hace un momento";
    }
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      replyMutation.mutate(replyContent);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link href="/forum" className="inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft size={16} />
            Volver al foro
          </Link>
        </motion.div>

        {/* Thread header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-2 mb-4">
                {thread.isPinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin size={12} /> Fijado
                  </Badge>
                )}
                {thread.isLocked && (
                  <Badge variant="outline" className="gap-1">
                    <Lock size={12} /> Cerrado
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {thread.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatTime(thread.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {thread.viewCount} vistas
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  {posts.length} respuestas
                </span>
              </div>

              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{thread.content}</p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">A</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Share2 size={16} className="mr-1" /> Compartir
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Flag size={16} className="mr-1" /> Reportar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Replies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare size={20} />
            Respuestas ({posts.length})
          </h2>

          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatarUrl} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {post.author.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {post.author.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(post.createdAt)}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4">{post.content}</p>

                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-gray-500 hover:text-secondary"
                          onClick={() => voteMutation.mutate({ postId: post.id, voteType: "up" })}
                        >
                          <ThumbsUp size={16} />
                          {post.upvotes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-gray-500 hover:text-red-600"
                          onClick={() => voteMutation.mutate({ postId: post.id, voteType: "down" })}
                        >
                          <ThumbsDown size={16} />
                          {post.downvotes}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500">
                          Responder
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Reply form */}
        {!thread.isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Escribe una respuesta</h3>
                <form onSubmit={handleSubmitReply}>
                  <Textarea
                    placeholder="Escribe tu respuesta aquí..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                    className="mb-4"
                  />
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!replyContent.trim() || replyMutation.isPending}
                      className="gap-2"
                    >
                      <Send size={16} />
                      {replyMutation.isPending ? "Enviando..." : "Enviar respuesta"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
