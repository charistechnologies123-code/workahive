import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function ensureConfigured() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
}

export function createStorageClient() {
  ensureConfigured();

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function buildSafeFileName(originalName, fallbackPrefix = "file") {
  const fallback = `${fallbackPrefix}-${Date.now()}.bin`;
  const base = path.basename(originalName || "").replace(/\s+/g, "_");
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "");
  return safe || fallback;
}

export function serializeStorageError(error) {
  if (!error) return null;

  return {
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status,
    statusCode: error.statusCode,
    stack: error.stack,
  };
}

export async function uploadBufferToStorage({
  bucketName,
  objectPath,
  buffer,
  contentType,
  publicUrl = true,
}) {
  const client = createStorageClient();

  const { data, error } = await client.storage.from(bucketName).upload(objectPath, buffer, {
    contentType,
    upsert: false,
  });

  if (error) {
    const uploadError = new Error(error.message || "Failed to upload file");
    uploadError.code = error.code;
    uploadError.status = error.status;
    uploadError.statusCode = error.statusCode;
    uploadError.bucket = bucketName;
    uploadError.objectPath = objectPath;
    uploadError.storageError = serializeStorageError(error);
    throw uploadError;
  }

  return {
    path: data.path,
    publicUrl: publicUrl
      ? client.storage.from(bucketName).getPublicUrl(data.path).data.publicUrl
      : null,
  };
}

export async function deleteObjectFromStorage({ bucketName, objectPath }) {
  if (!bucketName || !objectPath) return;

  const client = createStorageClient();
  await client.storage.from(bucketName).remove([objectPath]);
}

export function buildStorageObjectPath(parts, fileName) {
  const segments = [...parts, fileName].filter(Boolean).map((segment) =>
    String(segment).replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "")
  );

  return segments.join("/");
}

export function randomStorageFileName(originalName, fallbackPrefix = "file") {
  return `${Date.now()}-${crypto.randomUUID()}-${buildSafeFileName(originalName, fallbackPrefix)}`;
}
