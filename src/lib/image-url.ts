export function isSupportedImageUrl(value: string): boolean {
  if (value.startsWith("/media/") && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (["www.robotis.com", "robotis.com"].includes(url.hostname) ? url.pathname.startsWith("/data/") : ["firebasestorage.googleapis.com", "storage.googleapis.com"].includes(url.hostname));
  } catch { return false; }
}
