import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Download, Eye, Calendar, User, Book, FileText, 
  GraduationCap, Tag, Globe, Clock, Heart, Share2, Loader2,
  BookOpen, FileType, Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EmbeddedDocumentViewer, getFileTypeFromMime } from "@/components/EmbeddedDocumentViewer";

interface ResourceDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  abstract: string | null;
  type: string;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  publicationYear: number | null;
  language: string | null;
  pages: number | null;
  keywords: string | null;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  fileId: number | null;
  categoryId: number | null;
  careerId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  careerName: string | null;
  careerCode: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileMimeType: string | null;
  filePath: string | null;
  fileStorageType: string | null;
  uploaderUsername: string | null;
  uploaderFirstName: string | null;
  uploaderLastName: string | null;
}

const typeLabels: Record<string, string> = {
  book: "Libro",
  libro: "Libro",
  thesis: "Tesis",
  tesis: "Tesis",
  article: "Artículo",
  articulo: "Artículo",
  video: "Video",
  document: "Documento",
  software: "Software",
};

const typeIcons: Record<string, React.ElementType> = {
  book: Book,
  libro: Book,
  thesis: GraduationCap,
  tesis: GraduationCap,
  article: FileText,
  articulo: FileText,
  video: BookOpen,
  document: FileType,
  software: FileType,
};

export default function Resource() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: resource, isLoading, error } = useQuery<ResourceDetail>({
    queryKey: ["resource", id],
    queryFn: async () => {
      const res = await fetch(`/api/resources/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("No se pudo cargar el recurso");
      return res.json();
    },
    enabled: !!id && /^\d+$/.test(id),
  });

  const handleDownload = async () => {
    if (!resource?.fileId) {
      toast({ title: "Este recurso no tiene archivo adjunto", variant: "destructive" });
      return;
    }

    setIsDownloading(true);
    try {
      const res = await fetch(`/api/resources/${id}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al obtener enlace de descarga");
      
      const data = await res.json();
      
      if (data.downloadUrl) {
        // Open download URL in new tab
        window.open(data.downloadUrl, "_blank");
        toast({ title: "Descarga iniciada", description: data.filename });
      }
    } catch (err) {
      toast({ title: "Error al descargar", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const TypeIcon = resource ? (typeIcons[resource.type?.toLowerCase()] || FileText) : FileText;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recurso no encontrado</h1>
        <p className="text-gray-500 mb-6">El recurso que buscas no existe o fue eliminado.</p>
        <Link href="/">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              Volver a la biblioteca
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Document Viewer - Full Width at Top */}
        {resource.fileId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <EmbeddedDocumentViewer
              fileUrl={`/api/resources/${id}/view`}
              fileName={resource.fileName || "documento"}
              fileType={getFileTypeFromMime(resource.fileMimeType || "application/pdf")}
              mimeType={resource.fileMimeType || undefined}
              onDownload={handleDownload}
            />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6 md:p-8">
                  {/* Type Badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TypeIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-1">
                        {typeLabels[resource.type?.toLowerCase()] || resource.type}
                      </Badge>
                      {resource.careerName && (
                        <p className="text-sm text-gray-500">{resource.careerName}</p>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {resource.title}
                  </h1>

                  {/* Author & Meta */}
                  {resource.author && (
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{resource.author}</span>
                      {resource.publicationYear && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span>{resource.publicationYear}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{resource.viewCount} vistas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      <span>{resource.downloadCount} descargas</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Subido {formatDate(resource.createdAt)}</span>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Description */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h2>
                    <div 
                      className="prose prose-gray max-w-none text-gray-600"
                      dangerouslySetInnerHTML={{ __html: resource.description || "Sin descripción disponible." }}
                    />
                  </div>

                  {/* Abstract */}
                  {resource.abstract && (
                    <div className="mt-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Resumen / Abstract</h2>
                      <div 
                        className="prose prose-gray max-w-none text-gray-600 bg-gray-50 p-4 rounded-lg"
                        dangerouslySetInnerHTML={{ __html: resource.abstract }}
                      />
                    </div>
                  )}

                  {/* Keywords */}
                  {resource.keywords && (
                    <div className="mt-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Palabras clave</h2>
                      <div className="flex flex-wrap gap-2">
                        {resource.keywords.split(",").map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="bg-gray-50">
                            <Tag className="w-3 h-3 mr-1" />
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Descargar Recurso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resource.fileId ? (
                    <>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium truncate">{resource.fileName}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{resource.fileMimeType?.split("/")[1]?.toUpperCase() || "FILE"}</span>
                          <span>{formatFileSize(resource.fileSize)}</span>
                        </div>
                      </div>
                      
                      {/* Download Button */}
                      <Button 
                        className="w-full gap-2 bg-primary hover:bg-primary/90" 
                        size="lg"
                        onClick={handleDownload}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {isDownloading ? "Obteniendo enlace..." : "Descargar Archivo"}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Este recurso no tiene archivo adjunto</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-1" size="sm">
                      <Heart className="w-4 h-4" />
                      Favorito
                    </Button>
                    <Button variant="outline" className="flex-1 gap-1" size="sm">
                      <Share2 className="w-4 h-4" />
                      Compartir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Información</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resource.categoryName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Categoría</span>
                      <Badge variant="secondary">{resource.categoryName}</Badge>
                    </div>
                  )}
                  {resource.careerName && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500 text-sm">Carrera</span>
                      <span className="text-sm text-right max-w-[60%]">{resource.careerName}</span>
                    </div>
                  )}
                  {resource.publisher && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500 text-sm">Editorial</span>
                      <span className="text-sm text-right max-w-[60%]">{resource.publisher}</span>
                    </div>
                  )}
                  {resource.isbn && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">ISBN</span>
                      <span className="text-sm font-mono">{resource.isbn}</span>
                    </div>
                  )}
                  {resource.language && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Idioma</span>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{resource.language === "es" ? "Español" : resource.language}</span>
                      </div>
                    </div>
                  )}
                  {resource.pages && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Páginas</span>
                      <span className="text-sm">{resource.pages}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Subido por</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm font-medium">
                        {resource.uploaderFirstName || resource.uploaderUsername || "Anónimo"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
