import { Book, FileText, File } from "lucide-react";
import { type Resource } from "@shared/schema";
import { motion } from "framer-motion";

interface ResourceCardProps {
  resource: Resource;
  index: number;
}

export function ResourceCard({ resource, index }: ResourceCardProps) {
  
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText className="w-6 h-6" />;
      case 'book': return <Book className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'book': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group relative h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full bg-[#3a1d5c] border border-white/5 rounded-2xl p-6 hover:border-primary/50 transition-colors duration-300 flex flex-col shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${getBadgeColor(resource.type)} border`}>
            {getIcon(resource.type)}
          </div>
          <span className="text-xs font-mono text-white/40 uppercase tracking-widest">{resource.type}</span>
        </div>

        <h3 className="font-display font-bold text-xl text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {resource.title}
        </h3>
        
        <p className="text-white/60 text-sm mb-4 flex-grow line-clamp-3">
          {resource.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/50 uppercase tracking-tight">
            {resource.career}
          </span>
          <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/50 uppercase tracking-tight">
            {resource.topic}
          </span>
          <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/50 uppercase tracking-tight">
            {resource.purpose}
          </span>
        </div>

        <a 
          href={resource.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-white/5 hover:bg-primary hover:text-background text-sm font-bold border border-white/10 hover:border-primary transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/25"
        >
          View Resource
        </a>
      </div>
    </motion.div>
  );
}
