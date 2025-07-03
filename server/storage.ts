import { images, adminSessions, type Image, type InsertImage, type AdminSession, type InsertAdminSession } from "../shared/schema.js";
import { db } from "./db";
import { eq, desc, lt } from "drizzle-orm";

export interface IStorage {
  // Image operations
  getImages(): Promise<Image[]>;
  getImage(id: number): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  deleteImage(id: number): Promise<void>;
  
  // Admin session operations
  createAdminSession(session: InsertAdminSession): Promise<AdminSession>;
  getAdminSession(sessionId: string): Promise<AdminSession | undefined>;
  deleteAdminSession(sessionId: string): Promise<void>;
  cleanExpiredSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getImages(): Promise<Image[]> {
    return await db.select().from(images).orderBy(desc(images.uploadedAt));
  }

  async getImage(id: number): Promise<Image | undefined> {
    const [image] = await db.select().from(images).where(eq(images.id, id));
    return image || undefined;
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const [image] = await db
      .insert(images)
      .values(insertImage)
      .returning();
    return image;
  }

  async deleteImage(id: number): Promise<void> {
    await db.delete(images).where(eq(images.id, id));
  }

  async createAdminSession(insertSession: InsertAdminSession): Promise<AdminSession> {
    const [session] = await db
      .insert(adminSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getAdminSession(sessionId: string): Promise<AdminSession | undefined> {
    const [session] = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.id, sessionId));
    
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    
    if (session) {
      await this.deleteAdminSession(sessionId);
    }
    
    return undefined;
  }

  async deleteAdminSession(sessionId: string): Promise<void> {
    await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
  }

  async cleanExpiredSessions(): Promise<void> {
    const now = new Date();
    await db.delete(adminSessions).where(lt(adminSessions.expiresAt, now));
  }
}

export const storage = new DatabaseStorage();
