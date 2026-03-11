import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageSquare, Users, Clock, ChevronRight, BookOpen, Lightbulb, HelpCircle, Megaphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  threadCount: number;
  postCount: number;
}

const iconMap: Record<string, React.ElementType> = {
  book: BookOpen,
  lightbulb: Lightbulb,
  help: HelpCircle,
  megaphone: Megaphone,
  message: MessageSquare,
};

export default function ForumCategories() {
  const { data: categories = [], isLoading } = useQuery<ForumCategory[]>({
    queryKey: ["forum-categories"],
    queryFn: async () => {
      const res = await fetch("/api/forum/categories");
      return res.json();
    },
  });

  // Default categories if none exist
  const defaultCategories: ForumCategory[] = [
    {
      id: 1,
      name: "Anuncios",
      slug: "anuncios",
      description: "Noticias y anuncios importantes de la biblioteca",
      icon: "megaphone",
      color: "#3B82F6",
      threadCount: 5,
      postCount: 12,
    },
    {
      id: 2,
      name: "Ayuda General",
      slug: "ayuda-general",
      description: "Preguntas y respuestas sobre el uso de la biblioteca",
      icon: "help",
      color: "#10B981",
      threadCount: 23,
      postCount: 89,
    },
    {
      id: 3,
      name: "Recursos Académicos",
      slug: "recursos-academicos",
      description: "Discusión sobre libros, artículos y materiales de estudio",
      icon: "book",
      color: "#8B5CF6",
      threadCount: 45,
      postCount: 234,
    },
    {
      id: 4,
      name: "Sugerencias",
      slug: "sugerencias",
      description: "Propuestas para mejorar la biblioteca digital",
      icon: "lightbulb",
      color: "#F59E0B",
      threadCount: 18,
      postCount: 67,
    },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Foro de la Comunidad
          </h1>
          <p className="text-gray-600 mt-2">
            Participa en discusiones, haz preguntas y comparte conocimiento con otros usuarios
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <MessageSquare className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {displayCategories.reduce((a, c) => a + c.threadCount, 0)}
                </p>
                <p className="text-sm text-gray-500">Temas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Users className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {displayCategories.reduce((a, c) => a + c.postCount, 0)}
                </p>
                <p className="text-sm text-gray-500">Respuestas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-gray-900">Activo</p>
                <p className="text-sm text-gray-500">Hace 5 min</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Categories list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : (
            displayCategories.map((category, index) => {
              const IconComponent = iconMap[category.icon] || MessageSquare;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link href={`/forum/category/${category.slug}`}>
                    <Card className="hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <IconComponent
                            className="w-7 h-7"
                            style={{ color: category.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-500">{category.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>{category.threadCount} temas</span>
                            <span>{category.postCount} respuestas</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}
