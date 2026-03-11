/**
 * Script de Seed - BiblioUPY
 * Ejecutar: npx tsx backend/src/script/seed.ts
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { careers, categories, forumCategories } from "../../../shared/schema";

// Crear conexión directa para el seed
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/biblioupy",
});

const db = drizzle(pool);

async function seed() {
  console.log("🌱 Iniciando seed de la base de datos...\n");

  // ============================================================================
  // CARRERAS UPY
  // ============================================================================
  console.log("📚 Insertando carreras...");
  
  const careersData = [
    {
      name: "Ingeniería en Ciberseguridad",
      code: "ICS",
      description: "Formación de profesionales especializados en protección de sistemas informáticos, redes y datos contra amenazas cibernéticas.",
      facultyName: "Facultad de Ingeniería",
      isActive: true,
    },
    {
      name: "Ingeniería en Robótica",
      code: "IRO",
      description: "Desarrollo de sistemas robóticos y automatización industrial con enfoque en la Industria 4.0.",
      facultyName: "Facultad de Ingeniería",
      isActive: true,
    },
    {
      name: "Ingeniería en Ciencia de Datos",
      code: "ICD",
      description: "Análisis de grandes volúmenes de datos para la toma de decisiones estratégicas utilizando técnicas de machine learning e inteligencia artificial.",
      facultyName: "Facultad de Ingeniería",
      isActive: true,
    },
    {
      name: "Ingeniería en Sistemas Embebidos",
      code: "ISE",
      description: "Diseño y desarrollo de sistemas computacionales integrados en dispositivos electrónicos y IoT.",
      facultyName: "Facultad de Ingeniería",
      isActive: true,
    },
  ];

  for (const career of careersData) {
    try {
      const exists = await db.select().from(careers).limit(100);
      const found = exists.find(c => c.code === career.code);
      
      if (!found) {
        await db.insert(careers).values(career);
        console.log(`  ✅ ${career.name}`);
      } else {
        console.log(`  ⏭️  ${career.name} (ya existe)`);
      }
    } catch (err) {
      console.log(`  ❌ Error insertando ${career.name}:`, err);
    }
  }

  // ============================================================================
  // CATEGORÍAS DE RECURSOS
  // ============================================================================
  console.log("\n📂 Insertando categorías de recursos...");
  
  const categoriesData = [
    {
      name: "Libros",
      slug: "libros",
      description: "Libros de texto, manuales y material de referencia",
      iconName: "book",
      color: "#663399",
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Tesis",
      slug: "tesis",
      description: "Trabajos de titulación y proyectos terminales",
      iconName: "graduation-cap",
      color: "#D4A03F",
      sortOrder: 2,
      isActive: true,
    },
    {
      name: "Artículos",
      slug: "articulos",
      description: "Artículos científicos y publicaciones académicas",
      iconName: "file-text",
      color: "#2563EB",
      sortOrder: 3,
      isActive: true,
    },
    {
      name: "Documentos",
      slug: "documentos",
      description: "Notas de clase, guías y documentación técnica",
      iconName: "file",
      color: "#16A34A",
      sortOrder: 4,
      isActive: true,
    },
    {
      name: "Videos",
      slug: "videos",
      description: "Video tutoriales y conferencias grabadas",
      iconName: "video",
      color: "#DC2626",
      sortOrder: 5,
      isActive: true,
    },
    {
      name: "Software",
      slug: "software",
      description: "Herramientas, código fuente y scripts",
      iconName: "code",
      color: "#7C3AED",
      sortOrder: 6,
      isActive: true,
    },
  ];

  for (const category of categoriesData) {
    try {
      const exists = await db.select().from(categories).limit(100);
      const found = exists.find(c => c.slug === category.slug);
      
      if (!found) {
        await db.insert(categories).values(category);
        console.log(`  ✅ ${category.name}`);
      } else {
        console.log(`  ⏭️  ${category.name} (ya existe)`);
      }
    } catch (err) {
      console.log(`  ❌ Error insertando ${category.name}:`, err);
    }
  }

  // ============================================================================
  // CATEGORÍAS DEL FORO
  // ============================================================================
  console.log("\n💬 Insertando categorías del foro...");
  
  const forumCategoriesData = [
    {
      name: "Anuncios",
      slug: "anuncios",
      description: "Anuncios oficiales de la biblioteca y la universidad",
      iconName: "megaphone",
      color: "#DC2626",
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Ciberseguridad",
      slug: "ciberseguridad",
      description: "Discusiones sobre seguridad informática, hacking ético y protección de datos",
      iconName: "shield",
      color: "#663399",
      sortOrder: 2,
      isActive: true,
    },
    {
      name: "Robótica",
      slug: "robotica",
      description: "Proyectos de robótica, automatización e Industria 4.0",
      iconName: "bot",
      color: "#2563EB",
      sortOrder: 3,
      isActive: true,
    },
    {
      name: "Ciencia de Datos",
      slug: "ciencia-de-datos",
      description: "Machine learning, análisis de datos e inteligencia artificial",
      iconName: "brain",
      color: "#16A34A",
      sortOrder: 4,
      isActive: true,
    },
    {
      name: "Sistemas Embebidos",
      slug: "sistemas-embebidos",
      description: "IoT, microcontroladores y desarrollo de firmware",
      iconName: "cpu",
      color: "#D4A03F",
      sortOrder: 5,
      isActive: true,
    },
    {
      name: "Proyectos",
      slug: "proyectos",
      description: "Comparte tus proyectos y colabora con otros estudiantes",
      iconName: "folder-kanban",
      color: "#7C3AED",
      sortOrder: 6,
      isActive: true,
    },
    {
      name: "General",
      slug: "general",
      description: "Discusiones generales y off-topic",
      iconName: "message-circle",
      color: "#6B7280",
      sortOrder: 99,
      isActive: true,
    },
  ];

  for (const forumCat of forumCategoriesData) {
    try {
      const exists = await db.select().from(forumCategories).limit(100);
      const found = exists.find(c => c.slug === forumCat.slug);
      
      if (!found) {
        await db.insert(forumCategories).values(forumCat);
        console.log(`  ✅ ${forumCat.name}`);
      } else {
        console.log(`  ⏭️  ${forumCat.name} (ya existe)`);
      }
    } catch (err) {
      console.log(`  ❌ Error insertando ${forumCat.name}:`, err);
    }
  }

  console.log("\n✨ Seed completado exitosamente!\n");
  await pool.end();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("❌ Error en seed:", err);
  await pool.end();
  process.exit(1);
});
