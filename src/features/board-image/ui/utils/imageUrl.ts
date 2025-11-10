export interface ImagePathLike {
  thumbnailPath?: string | null;
  displayPath?: string | null;
  originalPath?: string | null;
}

export const buildImagePreviewUrl = (
  image: ImagePathLike | null | undefined
): string | null => {
  if (!image) {
    return null;
  }

  if (image.thumbnailPath) {
    return `/api/images/${image.thumbnailPath}`;
  }

  if (image.displayPath) {
    return `/api/images/${image.displayPath}`;
  }

  if (image.originalPath) {
    return `/api/images/${image.originalPath}`;
  }

  return null;
};
