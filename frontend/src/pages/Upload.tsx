import { useLanguage } from "@/lib/i18n";
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, UploadCloud, ArrowLeft, Link2, FileUp, X, FileText, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

type UploadMode = "file" | "url";

interface FileInfo {
  file: File;
  name: string;
  size: number;
  type: string;
}

interface Career {
  id: number;
  name: string;
  code: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function Upload() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check authentication
  const { data: user, error: authError } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authError) {
      toast({
        title: "Acceso requerido",
        description: "Debes iniciar sesión para subir recursos",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [authError, setLocation, toast]);
  
  // Form state
  const [mode, setMode] = useState<UploadMode>("file");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [type, setType] = useState("documento");
  const [category, setCategory] = useState("");
  const [career, setCareer] = useState("");
  const [author, setAuthor] = useState("");
  const [publicationYear, setPublicationYear] = useState("");

  // Fetch categories from API
  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch careers from API
  const { data: careers = [] } = useQuery<Career[]>({
    queryKey: ["careers"],
    queryFn: async () => {
      const res = await fetch("/api/careers");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const resourceTypes = [
    { id: "libro", label: "Libro" },
    { id: "tesis", label: "Tesis" },
    { id: "articulo", label: "Artículo" },
    { id: "documento", label: "Documento" },
    { id: "video", label: "Video" },
    { id: "presentacion", label: "Presentación" },
    { id: "software", label: "Software / Código" },
  ];

  // File handling
  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // Presentations
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Spreadsheets
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      // Videos
      "video/mp4",
      "video/webm",
      "video/ogg",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no permitido",
        description: "Formatos permitidos: PDF, Word, PowerPoint, Excel, imágenes y videos",
        variant: "destructive",
      });
      return;
    }

    // Videos can be larger (500MB), other files 100MB
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 500 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Archivo muy grande",
        description: isVideo ? "El tamaño máximo para videos es 500MB" : "El tamaño máximo es 100MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Auto-fill title if empty
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(nameWithoutExt);
    }
  }, [title, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Upload to S3 through server
  const uploadFileToS3 = async (): Promise<{ key: string; filename: string; contentType: string; size: number } | null> => {
    if (!selectedFile) return null;

    try {
      setUploadProgress(10);
      
      const formData = new FormData();
      formData.append("file", selectedFile.file);

      const xhr = new XMLHttpRequest();
      
      const result = await new Promise<{ key: string; filename: string; contentType: string; size: number }>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = 10 + Math.round((e.loaded / e.total) * 80);
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error("Error al procesar respuesta"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || "Error al subir archivo"));
            } catch {
              reject(new Error("Error al subir archivo"));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Error de red")));

        xhr.open("POST", "/api/uploads/s3");
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      setUploadProgress(95);
      
      return result;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({ title: "El título es requerido", variant: "destructive" });
      return;
    }

    if (!description.trim()) {
      toast({ title: "La descripción es requerida", variant: "destructive" });
      return;
    }

    if (mode === "file" && !selectedFile) {
      toast({ title: "Selecciona un archivo", variant: "destructive" });
      return;
    }

    if (mode === "url" && !externalUrl.trim()) {
      toast({ title: "Ingresa una URL válida", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (mode === "file") {
        // Upload file to S3 and create resource
        const uploadResult = await uploadFileToS3();
        
        if (!uploadResult) {
          throw new Error("Error en la subida");
        }

        // Confirm upload and create resource
        const confirmRes = await fetch("/api/uploads/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            key: uploadResult.key,
            filename: uploadResult.filename,
            contentType: uploadResult.contentType,
            size: uploadResult.size,
            metadata: {
              title,
              description,
              type,
              categoryId: category ? parseInt(category) : null,
              careerId: career ? parseInt(career) : null,
              author: author || null,
              publicationYear: publicationYear ? parseInt(publicationYear) : null,
            },
          }),
        });

        if (!confirmRes.ok) {
          const error = await confirmRes.json();
          throw new Error(error.message || "Error al crear recurso");
        }

        setUploadProgress(100);
      } else {
        // Create resource with external URL
        const res = await fetch("/api/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title,
            description,
            type,
            link: externalUrl,
            career: careers.find(c => c.id.toString() === career)?.name || "General",
            topic: "General",
            theme: "General",
            purpose: "Reference",
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Error al crear recurso");
        }
      }

      toast({
        title: "¡Recurso subido exitosamente!",
        description: "Tu recurso ya está disponible en la biblioteca",
        className: "bg-green-600 border-green-700 text-white",
      });

      setLocation("/");
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: error.message || "Error al subir el recurso",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Redirect in progress or not authenticated */}
        {authError && (
          <div className="text-center py-20">
            <p className="text-gray-500">Redirigiendo a inicio de sesión...</p>
          </div>
        )}

        {!authError && user && (
          <>
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-primary mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-lg"
            >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
              Compartir Recurso
            </h1>
          </div>
          <p className="text-gray-500 mb-8 ml-16">Comparte documentos, libros o enlaces con la comunidad UPY</p>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-8 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("file")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                mode === "file" 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileUp className="w-5 h-5" />
              Subir Archivo
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                mode === "url" 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Link2 className="w-5 h-5" />
              Enlace Externo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* File Upload Zone */}
            {mode === "file" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Archivo</label>
                
                {!selectedFile ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                      relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                      ${isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
                      }
                    `}
                  >
                    <input
                      type="file"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      Arrastra tu archivo aquí o <span className="text-primary">busca en tu equipo</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      PDF, Word, JPEG, PNG — Máximo 100MB
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {isUploading && uploadProgress > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subiendo archivo...</span>
                      <span className="text-primary font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}

            {/* External URL */}
            {mode === "url" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">URL del recurso</label>
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://ejemplo.com/documento.pdf"
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Título *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Introducción a la Ciberseguridad"
                className="bg-gray-50 border-gray-200"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Descripción *</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe brevemente el contenido del recurso..."
                rows={4}
                className="bg-gray-50 border-gray-200 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tipo de recurso</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-gray-900"
                >
                  {resourceTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-gray-900"
                >
                  <option value="">Selecciona una categoría</option>
                  {categoriesData.map((c) => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Career */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Carrera relacionada</label>
                <select
                  value={career}
                  onChange={(e) => setCareer(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-gray-900"
                >
                  <option value="">Todas las carreras</option>
                  {careers.map((c) => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Año de publicación</label>
                <Input
                  type="number"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(e.target.value)}
                  placeholder="2024"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Author */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Autor (opcional)</label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Nombre del autor"
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isUploading}
              className="w-full py-6 text-lg font-bold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {uploadProgress < 100 ? "Subiendo..." : "Finalizando..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Compartir Recurso
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Tu recurso estará disponible inmediatamente para toda la comunidad UPY
            </p>

          </form>
        </motion.div>
          </>
        )}
      </div>
    </main>
  );
}