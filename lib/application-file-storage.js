import { buildStorageObjectPath, deleteObjectFromStorage, randomStorageFileName, uploadBufferToStorage } from "./storage";

const APPLICATION_BUCKET_NAME = process.env.CV_BUCKET_NAME || "cvs";

export async function uploadApplicationFileToStorage({
  buffer,
  contentType,
  originalName,
  jobId,
  applicantId,
  fieldKey,
}) {
  const fileName = randomStorageFileName(originalName, "application");
  const objectPath = buildStorageObjectPath(
    ["applications", jobId, applicantId, fieldKey],
    fileName
  );

  console.log("[application-file-storage] uploading file", {
    bucket: APPLICATION_BUCKET_NAME,
    objectPath,
    contentType,
    originalName,
    jobId,
    applicantId,
    fieldKey,
    size: buffer?.length,
  });

  const uploadResult = await uploadBufferToStorage({
    bucketName: APPLICATION_BUCKET_NAME,
    objectPath,
    buffer,
    contentType,
    publicUrl: true,
  });

  return {
    path: uploadResult.path,
    publicUrl: uploadResult.publicUrl,
  };
}

export async function deleteApplicationFileFromStorage(objectPath) {
  if (!objectPath) return;

  await deleteObjectFromStorage({
    bucketName: APPLICATION_BUCKET_NAME,
    objectPath,
  });
}
