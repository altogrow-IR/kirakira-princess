const supportedTypes = ["image/png", "image/jpeg", "image/webp"];

export function isSupportedImageType(file: File): boolean {
  return supportedTypes.includes(file.type);
}

export function validateImageFile(file: File): { ok: boolean; message?: string } {
  if (!isSupportedImageType(file)) {
    return { ok: false, message: "PNG、JPG、WebP の画像をえらんでください。" };
  }
  return { ok: true };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("画像を読みこめませんでした。"));
    };
    reader.onerror = () => reject(new Error("画像を読みこめませんでした。"));
    reader.readAsDataURL(file);
  });
}
