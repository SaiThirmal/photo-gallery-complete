import { config } from "../config";
import { storage } from "../storage";
import { randomBytes } from "crypto";

export async function authenticateAdmin(email: string, password: string): Promise<string | null> {
  if (email === config.adminEmail && password === config.adminPassword) {
    const sessionId = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await storage.createAdminSession({
      id: sessionId,
      expiresAt,
    });
    
    return sessionId;
  }
  return null;
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const session = await storage.getAdminSession(sessionId);
  return !!session;
}

export async function logoutAdmin(sessionId: string): Promise<void> {
  await storage.deleteAdminSession(sessionId);
}
