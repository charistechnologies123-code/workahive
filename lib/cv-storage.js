import { buildStorageObjectPath, deleteObjectFromStorage, randomStorageFileName, uploadBufferToStorage } from "./storage";

const CV_BUCKET_NAME = process.env.CV_BUCKET_NAME || "cvs";

export async function uploadCvToStorage({ buffer, contentType, originalName, jobId, applicantId }) {
  const fileName = randomStorageFileName(originalName, "cv");
  const objectPath = buildStorageObjectPath(["applications", jobId, applicantId], fileName);

  console.log("[cv-storage] uploading cv", {
    bucket: CV_BUCKET_NAME,
    objectPath,
    contentType,
    originalName,
    jobId,
    applicantId,
    size: buffer?.length,
  });

  let uploadResult;
  try {
    uploadResult = await uploadBufferToStorage({
      bucketName: CV_BUCKET_NAME,
      objectPath,
      buffer,
      contentType,
      publicUrl: true,
    });
  } catch (error) {
    console.error("[cv-storage] upload failed", {
      bucket: CV_BUCKET_NAME,
      objectPath,
      error: {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        code: error.code,
        storageError: error.storageError,
      },
    });
    throw error;
  }

  console.log("[cv-storage] upload succeeded", {
    bucket: CV_BUCKET_NAME,
    objectPath: uploadResult.path,
  });

  return {
    path: uploadResult.path,
    publicUrl: uploadResult.publicUrl,
  };
}

export async function deleteCvFromStorage(objectPath) {
  if (!objectPath) return;

  try {
    console.log("[cv-storage] deleting orphaned cv", {
      bucket: CV_BUCKET_NAME,
      objectPath,
    });

    await deleteObjectFromStorage({
      bucketName: CV_BUCKET_NAME,
      objectPath,
    });
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
