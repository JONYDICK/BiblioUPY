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
      
      <div className="relative h-full bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-primary hover:bg-white/[0.04] transition-all duration-300 flex flex-col shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-xl ${getBadgeColor(resource.type)} border shadow-inner`}>
            {getIcon(resource.type)}
          </div>
          <div className="text-right">
            <span className="block text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">{resource.type}</span>
            <span className="block text-xs font-medium text-primary/80">{resource.purpose}</span>
          </div>
        </div>

        <h3 className="font-display font-bold text-lg text-white mb-3 line-clamp-2 leading-snug">
          {resource.title}
        </h3>
        
        <p className="text-white/50 text-sm mb-6 flex-grow line-clamp-3 leading-relaxed">
          {resource.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <span className="px-2.5 py-1 rounded-md bg-primary/5 border border-primary/10 text-[10px] text-primary/70 font-bold uppercase tracking-wider">
            {resource.career}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-white/30 font-bold uppercase tracking-wider">
            {resource.topic}
          </span>
        </div>

        <a 
          href={resource.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-transparent hover:bg-primary text-white hover:text-background text-sm font-bold border border-white/10 hover:border-primary transition-all duration-300"
        >
          Access Resource
        </a>
      </div>
    </motion.div>
  );
}
