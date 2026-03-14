import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || "", "utf8").slice(0, 32);

export const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (payload) => {
  if (!payload || !payload.includes(":")) return payload;
  try {
    const [ivHex, authTagHex, encrypted] = payload.split(":");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      ENCRYPTION_KEY,
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return payload; // return as-is if decrypt fails (e.g. old unencrypted data)
  }
};
