import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.resources.list.path, async (req, res) => {
    const resources = await storage.getResources();
    res.json(resources);
  });

  app.post(api.resources.create.path, async (req, res) => {
    try {
      const input = api.resources.create.input.parse(req.body);
      const resource = await storage.createResource(input);
      res.status(201).json(resource);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getResources();
  if (existing.length === 0) {
    await storage.createResource({ title: "Introduction to Industry 5.0", type: "pdf", description: "Fundamental concepts of the new industrial revolution.", link: "#" });
    await storage.createResource({ title: "Advanced Robotics", type: "book", description: "Textbook for Mechatronics Engineering.", link: "#" });
    await storage.createResource({ title: "Data Science Algorithms", type: "document", description: "Cheat sheet for common algorithms.", link: "#" });
  }
}
