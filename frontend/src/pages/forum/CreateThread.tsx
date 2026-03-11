import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function CreateThread() {
  const params = useParams<{ categorySlug: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      // In real app, would get categoryId from slug
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          content,
          categoryId: 1, // Would be resolved from slug
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al crear el tema");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Tema creado", description: "Tu tema ha sido publicado exitosamente" });
      navigate(`/forum/thread/${data.slug || "nuevo-tema"}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("El título es requerido");
      return;
    }
    if (title.length < 5) {
      setError("El título debe tener al menos 5 caracteres");
      return;
    }
    if (!content.trim()) {
      setError("El contenido es requerido");
      return;
    }
    if (content.length < 20) {
      setError("El contenido debe tener al menos 20 caracteres");
      return;
    }

    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link 
            href={`/forum/category/${params.categorySlug}`} 
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft size={16} />
            Volver a la categoría
          </Link>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Crear nuevo tema</CardTitle>
              <CardDescription>
                Comparte tu pregunta, idea o comentario con la comunidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Título del tema</Label>
                  <Input
                    id="title"
                    placeholder="Ej: ¿Cómo puedo buscar recursos por autor?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {title.length}/200 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenido</Label>
                  <Textarea
                    id="content"
                    placeholder="Describe tu pregunta o comentario con detalle. Incluye toda la información relevante para que otros puedan ayudarte mejor."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    maxLength={10000}
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {content.length}/10000 caracteres
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Consejos para un buen tema:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Usa un título claro y descriptivo</li>
                    <li>• Proporciona contexto suficiente</li>
                    <li>• Sé específico en tu pregunta</li>
                    <li>• Revisa si ya existe un tema similar</li>
                    <li>• Mantén un tono respetuoso</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3">
                  <Link href={`/forum/category/${params.categorySlug}`}>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="gap-2"
                  >
                    <Send size={16} />
                    {createMutation.isPending ? "Publicando..." : "Publicar tema"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
