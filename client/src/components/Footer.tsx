import { useLanguage } from "@/lib/i18n";
import { GraduationCap, Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a052b] border-t border-white/5 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="font-display font-bold text-xl">BiblioUPY</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Empowering the next generation of engineers with industry 5.0 resources and knowledge sharing.
            </p>
          </div>

          {/* Links Placeholder */}
          <div>
            <h4 className="font-display font-bold text-lg mb-4 text-white">Links</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Socials Placeholder */}
          <div>
             <h4 className="font-display font-bold text-lg mb-4 text-white">Connect</h4>
             <div className="flex gap-4">
               <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-background transition-all">
                 <Github className="w-5 h-5" />
               </a>
               <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-background transition-all">
                 <Twitter className="w-5 h-5" />
               </a>
               <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-background transition-all">
                 <Linkedin className="w-5 h-5" />
               </a>
             </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 text-center text-white/40 text-sm">
          <p>© {currentYear} Universidad Politécnica de Yucatán. {t("footer_rights")}.</p>
        </div>
      </div>
    </footer>
  );
}
