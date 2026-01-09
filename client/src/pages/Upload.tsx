import { useLanguage } from "@/lib/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResourceSchema } from "@shared/schema";
import { useCreateResource } from "@/hooks/use-resources";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, UploadCloud, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

type FormData = z.infer<typeof insertResourceSchema>;

export default function Upload() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createResource = useCreateResource();

  const form = useForm<FormData>({
    resolver: zodResolver(insertResourceSchema),
    defaultValues: {
      title: "",
      type: "document",
      description: "",
      link: "",
      topic: "General",
      theme: "General",
      purpose: "Reference",
      career: "Cybersecurity",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createResource.mutateAsync(data);
      toast({
        title: t("form_success"),
        className: "bg-green-600 border-green-700 text-white",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const careers = [
    { id: 'cybersecurity', label: t("career_cybersecurity"), value: "Cybersecurity" },
    { id: 'robotics', label: t("career_robotics"), value: "Robotics" },
    { id: 'data', label: t("career_data"), value: "Data" },
    { id: 'embedded', label: t("career_embedded"), value: "Embedded Systems" },
  ];

  const purposes = [
    { id: 'research', label: t("purpose_research"), value: "Research" },
    { id: 'textbook', label: t("purpose_textbook"), value: "Textbook" },
    { id: 'reference', label: t("purpose_reference"), value: "Reference" },
  ];

  return (
    <main className="min-h-screen pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("form_cancel")}
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#240a38] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-primary/20 rounded-xl">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-white">
                {t("upload_title")}
              </h1>
            </div>
            <p className="text-white/60 mb-8 ml-16">{t("upload_desc")}</p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">{t("form_title")}</label>
                <input
                  {...form.register("title")}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/20 text-white"
                  placeholder="e.g. Intro to Advanced Robotics"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-400">{form.formState.errors.title.message}</p>
                )}
              </div>

              {/* Career Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">{t("form_career")}</label>
                <div className="grid grid-cols-2 gap-3">
                  {careers.map((career) => (
                    <label 
                      key={career.id}
                      className={`
                        cursor-pointer text-center py-3 rounded-xl border transition-all font-medium text-sm
                        ${form.watch('career') === career.value 
                          ? 'bg-primary text-background border-primary shadow-[0_0_15px_-3px_rgba(255,215,0,0.4)]' 
                          : 'bg-background/30 text-white/60 border-white/10 hover:bg-background/50'
                        }
                      `}
                    >
                      <input 
                        type="radio" 
                        value={career.value} 
                        {...form.register("career")} 
                        className="hidden"
                      />
                      {career.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topic Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">{t("form_topic")}</label>
                  <input
                    {...form.register("topic")}
                    className="w-full px-4 py-3 rounded-xl bg-background/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/20 text-white"
                    placeholder="e.g. Robotics"
                  />
                </div>

                {/* Purpose Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">{t("form_purpose")}</label>
                  <select
                    {...form.register("purpose")}
                    className="w-full px-4 py-3 rounded-xl bg-background/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white"
                  >
                    {purposes.map(p => (
                      <option key={p.id} value={p.value} className="bg-[#240a38]">{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">{t("form_type")}</label>
                <div className="grid grid-cols-3 gap-3">
                  {['book', 'document', 'pdf'].map((type) => (
                    <label 
                      key={type}
                      className={`
                        cursor-pointer text-center py-3 rounded-xl border transition-all font-medium text-sm capitalize
                        ${form.watch('type') === type 
                          ? 'bg-primary text-background border-primary shadow-[0_0_15px_-3px_rgba(255,215,0,0.4)]' 
                          : 'bg-background/30 text-white/60 border-white/10 hover:bg-background/50'
                        }
                      `}
                    >
                      <input 
                        type="radio" 
                        value={type} 
                        {...form.register("type")} 
                        className="hidden"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {/* Link Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">{t("form_link")}</label>
                <input
                  {...form.register("link")}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/20 text-white"
                  placeholder="https://..."
                />
                {form.formState.errors.link && (
                  <p className="text-sm text-red-400">{form.formState.errors.link.message}</p>
                )}
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">{t("form_description")}</label>
                <textarea
                  {...form.register("description")}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-white/20 text-white resize-none"
                  placeholder="Describe the contents of this resource..."
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-400">{form.formState.errors.description.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createResource.isPending}
                className="w-full py-4 rounded-xl bg-primary text-background font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {createResource.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  t("form_submit")
                )}
              </button>

            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
