import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listPublishedSermons = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("sermons")
    .select(
      "id,title,speaker,preached_on,series,scripture,description,video_url,audio_url,thumbnail_url,notes_url,duration_minutes",
    )
    .eq("is_published", true)
    .order("preached_on", { ascending: false })
    .limit(100);
  if (error) throw new Error("Sermons could not be loaded.");
  return data ?? [];
});

export const listPublishedEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("events")
    .select(
      "id,title,description,starts_at,ends_at,location,category,registration_url,image_url,is_featured",
    )
    .eq("is_published", true)
    .order("starts_at", { ascending: true })
    .limit(200);
  if (error) throw new Error("Events could not be loaded.");
  return data ?? [];
});

export const listPublishedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("blog_posts")
    .select("id,title,slug,excerpt,category,author,cover_image_url,published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Articles could not be loaded.");
  return data ?? [];
});

export const listPublishedResources = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("resources")
    .select("id,title,description,category,file_url,cover_image_url,created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Resources could not be loaded.");
  return data ?? [];
});

export const listPublishedGroups = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("connection_groups")
    .select(
      "id,name,description,meeting_day,meeting_time,location,host_name,age_focus,capacity,is_open",
    )
    .eq("is_published", true)
    .order("name", { ascending: true })
    .limit(100);
  if (error) throw new Error("Connection Groups could not be loaded.");
  return data ?? [];
});
