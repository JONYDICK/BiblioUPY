import { useLanguage } from "@/lib/i18n";
import { MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Brand & Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/favicon.png" alt="UPY" className="h-12 w-auto" />
              <div>
                <span className="block font-bold text-lg">BiblioUPY</span>
                <span className="block text-xs text-gray-400">Biblioteca Digital</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Juntos creamos el Futuro
            </p>
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" />
              <span>Tablaje Catastral 7193, Carretera Mérida-Tetiz Km.4.5, 97357 Yuc.</span>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h4 className="font-bold text-lg mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/" className="hover:text-secondary transition-colors">Inicio</a></li>
              <li><a href="/login" className="hover:text-secondary transition-colors">Compartir Recursos</a></li>
              <li><a href="https://upy.edu.mx" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Sitio Web UPY</a></li>
              <li><a href="https://upy.edu.mx/admision" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Admisiones</a></li>
            </ul>
          </div>

          {/* Carreras */}
          <div>
            <h4 className="font-bold text-lg mb-4">Carreras</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/?career=ciberseguridad" className="hover:text-secondary transition-colors">Ing. en Ciberseguridad</a></li>
              <li><a href="/?career=robotica" className="hover:text-secondary transition-colors">Ing. en Robótica</a></li>
              <li><a href="/?career=datos" className="hover:text-secondary transition-colors">Ing. en Bases de Datos</a></li>
              <li><a href="/?career=embebidos" className="hover:text-secondary transition-colors">Ing. en Sistemas Embebidos</a></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary" />
                <span>999 151 1791</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary" />
                <a href="mailto:contacto@upy.edu.mx" className="hover:text-secondary transition-colors">
                  contacto@upy.edu.mx
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© {currentYear} Universidad Politécnica de Yucatán. {t("footer_rights")}.</p>
            <div className="flex gap-6">
              <a href="https://upy.edu.mx" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">Sitio oficial UPY</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
