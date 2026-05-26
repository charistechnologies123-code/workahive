import { buildStorageObjectPath, deleteObjectFromStorage, randomStorageFileName, uploadBufferToStorage } from "./storage";

const BLOG_MEDIA_BUCKET_NAME = process.env.BLOG_MEDIA_BUCKET_NAME || process.env.CV_BUCKET_NAME || "cvs";

export async function uploadBlogMediaToStorage({ buffer, contentType, originalName, postId, kind = "images" }) {
  const fileName = randomStorageFileName(originalName, kind === "images" ? "blog-image" : "blog-file");
  const objectPath = buildStorageObjectPath(["blog", postId, kind], fileName);

  console.log("[blog-media-storage] uploading file", {
    bucket: BLOG_MEDIA_BUCKET_NAME,
    objectPath,
    contentType,
    originalName,
    postId,
    kind,
    size: buffer?.length,
  });

  const uploadResult = await uploadBufferToStorage({
    bucketName: BLOG_MEDIA_BUCKET_NAME,
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

export async function deleteBlogMediaFromStorage(objectPath) {
  if (!objectPath) return;

  await deleteObjectFromStorage({
    bucketName: BLOG_MEDIA_BUCKET_NAME,
    objectPath,
  });
}
