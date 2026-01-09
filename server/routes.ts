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
    await storage.createResource({ 
      title: "Network Security Fundamentals", 
      type: "pdf", 
      description: "Basic concepts of network protection and encryption.", 
      link: "#",
      topic: "Cybersecurity",
      theme: "Security",
      purpose: "Reference",
      career: "Cybersecurity"
    });
    await storage.createResource({ 
      title: "Advanced Robotics Systems", 
      type: "book", 
      description: "Comprehensive guide to robotic kinematics and control.", 
      link: "#",
      topic: "Robotics",
      theme: "Automation",
      purpose: "Textbook",
      career: "Robotics"
    });
    await storage.createResource({ 
      title: "Data Analytics with Python", 
      type: "document", 
      description: "Techniques for data processing and visualization.", 
      link: "#",
      topic: "Data",
      theme: "Analysis",
      purpose: "Research",
      career: "Data"
    });
    await storage.createResource({ 
      title: "RTOS Implementation", 
      type: "pdf", 
      description: "Real-time operating systems for embedded hardware.", 
      link: "#",
      topic: "Embedded Systems",
      theme: "Firmware",
      purpose: "Technical",
      career: "Embedded Systems"
    });
  }
}
