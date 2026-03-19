import { Book, FileText, File, Eye, Download, GraduationCap, Video, User } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface ResourceData {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  type: string;
  author?: string | null;
  publicationYear?: number | null;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  categoryName?: string | null;
  categorySlug?: string | null;
  careerName?: string | null;
  careerCode?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileMimeType?: string | null;
  uploaderUsername?: string | null;
  uploaderFirstName?: string | null;
  // Legacy support
  career?: string;
  purpose?: string;
  link?: string;
}

interface ResourceCardProps {
  resource: ResourceData;
  index: number;
}

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  book: { icon: Book, label: "Libro", color: "bg-blue-100 text-blue-700 border-blue-200" },
  libro: { icon: Book, label: "Libro", color: "bg-blue-100 text-blue-700 border-blue-200" },
  thesis: { icon: GraduationCap, label: "Tesis", color: "bg-purple-100 text-purple-700 border-purple-200" },
  tesis: { icon: GraduationCap, label: "Tesis", color: "bg-purple-100 text-purple-700 border-purple-200" },
  article: { icon: FileText, label: "Artículo", color: "bg-green-100 text-green-700 border-green-200" },
  articulo: { icon: FileText, label: "Artículo", color: "bg-green-100 text-green-700 border-green-200" },
  video: { icon: Video, label: "Video", color: "bg-red-100 text-red-700 border-red-200" },
  document: { icon: FileText, label: "Documento", color: "bg-gray-100 text-gray-700 border-gray-200" },
  pdf: { icon: FileText, label: "PDF", color: "bg-red-100 text-red-700 border-red-200" },
};

export function ResourceCard({ resource, index }: ResourceCardProps) {
  const typeKey = resource.type?.toLowerCase() || "document";
  const config = typeConfig[typeKey] || { icon: File, label: resource.type, color: "bg-gray-100 text-gray-700 border-gray-200" };
  const Icon = config.icon;

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
  };

  const careerDisplay = resource.careerName || resource.career || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      layout
    >
      <Link href={`/resource/${resource.id}`}>
        <Card className="group h-full bg-white border-gray-100 hover:border-primary/30 hover:shadow-xl transition-all duration-300 cursor-pointer">
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-xl ${config.color} border`}>
                <Icon className="w-5 h-5" />
              </div>
              {careerDisplay && (
                <Badge variant="outline" className="text-xs font-medium bg-primary/5 text-primary border-primary/20 truncate max-w-[140px]">
                  {careerDisplay}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[48px]">
              {resource.title}
            </h3>
            
            {/* Author & Year */}
            {(resource.author || resource.publicationYear) && (
              <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate">
                  {resource.author}
                  {resource.author && resource.publicationYear && " • "}
                  {resource.publicationYear}
                </span>
              </p>
            )}
            
            {/* Description */}
            {resource.description && (
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                {resource.description.replace(/<[^>]*>/g, "").substring(0, 120)}
                {resource.description.length > 120 ? "..." : ""}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {resource.viewCount || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  {resource.downloadCount || 0}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {formatDate(resource.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
