import { db } from "./db";
import { resources, type Resource, type InsertResource } from "../../shared/schema";

export interface IStorage {
  getResources(): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
}

export class DatabaseStorage implements IStorage {
  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources);
  }
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(insertResource).returning();
    return resource;
  }
}

export const storage = new DatabaseStorage();
