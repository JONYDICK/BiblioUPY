import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "es";

interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

// Simple translation dictionary
const translations: Translations = {
  // Navigation
  nav_home: { en: "Home", es: "Inicio" },
  nav_library: { en: "Library", es: "Biblioteca" },
  nav_upload: { en: "Upload Resource", es: "Subir Recurso" },
  nav_contact: { en: "Contact", es: "Contacto" },
  
  // Hero
  hero_title: { en: "UPY ENGINEERS WANTED", es: "INGENIEROS UPY BUSCADOS" },
  hero_subtitle: { en: "Join the Industry 5.0", es: "Sé parte de la Industria 5.0" },
  hero_cta: { en: "JOIN THE FUTURE", es: "UNIRME AL FUTURO" },
  
  // Resources
  resources_title: { en: "Academic Resources", es: "Recursos Académicos" },
  resources_empty: { en: "No resources found.", es: "No se encontraron recursos." },
  resources_loading: { en: "Loading resources...", es: "Cargando recursos..." },
  
  // Upload Page
  upload_title: { en: "Upload New Resource", es: "Subir Nuevo Recurso" },
  upload_desc: { en: "Share knowledge with the community.", es: "Comparte conocimiento con la comunidad." },
  
  // Form Labels
  form_title: { en: "Resource Title", es: "Título del Recurso" },
  form_type: { en: "Type", es: "Tipo" },
  form_description: { en: "Description", es: "Descripción" },
  form_link: { en: "Link URL", es: "Enlace URL" },
  form_topic: { en: "Topic", es: "Tema" },
  form_theme: { en: "Theme", es: "Trama" },
  form_purpose: { en: "Purpose", es: "Propósito" },
  form_career: { en: "Career", es: "Carrera" },
  form_submit: { en: "Create Resource", es: "Crear Recurso" },
  form_cancel: { en: "Cancel", es: "Cancelar" },
  form_success: { en: "Resource created successfully!", es: "¡Recurso creado con éxito!" },

  // Filters
  filter_all: { en: "All Resources", es: "Todos los Recursos" },
  filter_career: { en: "Career", es: "Carrera" },
  filter_topic: { en: "Topic", es: "Tema" },
  filter_purpose: { en: "Purpose", es: "Propósito" },
  filter_theme: { en: "Theme", es: "Trama" },

  // Careers
  career_all: { en: "All Careers", es: "Todas las Carreras" },
  career_industrial: { en: "Industrial Engineering", es: "Ingeniería Industrial" },
  career_mechatronics: { en: "Mechatronics", es: "Mecatrónica" },
  career_data_science: { en: "Data Science", es: "Ciencia de Datos" },

  // Purposes
  purpose_all: { en: "All Purposes", es: "Todos los Propósitos" },
  purpose_research: { en: "Research", es: "Investigación" },
  purpose_textbook: { en: "Textbook", es: "Libro de Texto" },
  purpose_reference: { en: "Reference", es: "Referencia" },

  // Footer
  footer_rights: { en: "All rights reserved", es: "Todos los derechos reservados" },
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "es" : "en"));
  };

  const t = (key: string) => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
