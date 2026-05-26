import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CV_BUCKET_NAME = process.env.CV_BUCKET_NAME || "cvs";

function getStorageClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase CV storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function buildSafeFileName(originalName) {
  const fallback = `cv-${Date.now()}.pdf`;
  const base = path.basename(originalName || "").replace(/\s+/g, "_");
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "");
  return safe || fallback;
}

export async function uploadCvToStorage({ buffer, contentType, originalName, jobId, applicantId }) {
  const client = getStorageClient();
  const fileName = `${Date.now()}-${crypto.randomUUID()}-${buildSafeFileName(originalName)}`;
  const objectPath = `applications/${jobId}/${applicantId}/${fileName}`;

  console.log("[cv-storage] uploading cv", {
    bucket: CV_BUCKET_NAME,
    objectPath,
    contentType,
    originalName,
    jobId,
    applicantId,
    size: buffer?.length,
  });

  const { data, error } = await client.storage
    .from(CV_BUCKET_NAME)
    .upload(objectPath, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    console.error("[cv-storage] upload failed", {
      bucket: CV_BUCKET_NAME,
      objectPath,
      error: {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        code: error.code,
      },
    });

    const uploadError = new Error(error.message || "Failed to upload CV");
    uploadError.code = error.code;
    uploadError.status = error.status;
    uploadError.statusCode = error.statusCode;
    uploadError.bucket = CV_BUCKET_NAME;
    uploadError.objectPath = objectPath;
    throw uploadError;
  }

  console.log("[cv-storage] upload succeeded", {
    bucket: CV_BUCKET_NAME,
    objectPath: data.path,
  });

  const { data: publicData } = client.storage.from(CV_BUCKET_NAME).getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: publicData.publicUrl,
  };
}

export async function deleteCvFromStorage(objectPath) {
  if (!objectPath) return;

  try {
    console.log("[cv-storage] deleting orphaned cv", {
      bucket: CV_BUCKET_NAME,
      objectPath,
    });

    const client = getStorageClient();
    await client.storage.from(CV_BUCKET_NAME).remove([objectPath]);
  } catch (error) {
    console.error("[cv-storage] failed to delete orphaned cv", {
      bucket: CV_BUCKET_NAME,
      objectPath,
      error: {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        status: error?.status,
        statusCode: error?.statusCode,
        stack: error?.stack,
      },
    });
  }
}
