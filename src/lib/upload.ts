import { supabase } from "@/integrations/supabase/client";

export type UploadKind = "image" | "audio" | "file";

export const UPLOAD_KINDS: Record<
  UploadKind,
  { accept: string; maxMB: number; folder: string; label: string }
> = {
  image: { accept: "image/jpeg,image/png,image/webp,image/gif", maxMB: 5, folder: "images", label: "image" },
  audio: {
    accept: "audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/ogg,.mp3,.m4a,.wav,.ogg",
    maxMB: 50,
    folder: "audio",
    label: "audio file",
  },
  file: {
    accept: ".pdf,.epub,.ppt,.pptx,.doc,.docx",
    maxMB: 25,
    folder: "documents",
    label: "document",
  },
};

const BUCKET = "media";

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  return `${base || "file"}${ext}`;
}

/** Uploads a file to the public `media` bucket and returns its public URL. */
export async function uploadMedia(file: File, kind: UploadKind): Promise<string> {
  const cfg = UPLOAD_KINDS[kind];
  if (file.size > cfg.maxMB * 1024 * 1024) {
    throw new Error(`That ${cfg.label} is larger than ${cfg.maxMB} MB.`);
  }
  const path = `${cfg.folder}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      ...(file.type ? { contentType: file.type } : {}),
    });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
