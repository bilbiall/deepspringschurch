export type FieldType = "text" | "textarea" | "date" | "datetime" | "number" | "checkbox";

export type FieldDef = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
};

export type ContentTable = {
  key: "sermons" | "events" | "blog_posts" | "connection_groups";
  label: string;
  orderBy: { column: string; ascending: boolean };
  titleField: string;
  subtitle: (row: Record<string, unknown>) => string;
  fields: FieldDef[];
};

export type SubmissionTable = {
  key:
    | "contact_messages"
    | "prayer_requests"
    | "visit_plans"
    | "child_registrations";
  label: string;
  orderBy: { column: string; ascending: boolean };
  columns: { name: string; label: string }[];
  statusOptions?: string[];
};

export const CONTENT_TABLES: ContentTable[] = [
  {
    key: "sermons",
    label: "Sermons",
    orderBy: { column: "preached_on", ascending: false },
    titleField: "title",
    subtitle: (r) => [r["speaker"], r["preached_on"], r["series"]].filter(Boolean).join(" · "),
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "speaker", label: "Speaker", required: true },
      { name: "preached_on", label: "Date preached", type: "date", required: true },
      { name: "series", label: "Series" },
      { name: "scripture", label: "Scripture" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "video_url", label: "Video URL" },
      { name: "audio_url", label: "Audio URL" },
      { name: "thumbnail_url", label: "Thumbnail URL" },
      { name: "duration_minutes", label: "Duration (minutes)", type: "number" },
    ],
  },
  {
    key: "events",
    label: "Events",
    orderBy: { column: "starts_at", ascending: true },
    titleField: "title",
    subtitle: (r) => [r["starts_at"], r["location"], r["category"]].filter(Boolean).join(" · "),
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "starts_at", label: "Starts", type: "datetime", required: true },
      { name: "ends_at", label: "Ends", type: "datetime" },
      { name: "location", label: "Location" },
      { name: "category", label: "Category" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "registration_url", label: "Registration URL" },
      { name: "image_url", label: "Image URL" },
      { name: "is_featured", label: "Featured event", type: "checkbox" },
    ],
  },
  {
    key: "blog_posts",
    label: "Blog posts",
    orderBy: { column: "created_at", ascending: false },
    titleField: "title",
    subtitle: (r) => [r["author"], r["category"], r["published_at"]].filter(Boolean).join(" · "),
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "slug", label: "Slug", required: true, placeholder: "walking-together" },
      { name: "author", label: "Author", required: true },
      { name: "category", label: "Category" },
      { name: "excerpt", label: "Excerpt", type: "textarea" },
      { name: "body", label: "Body", type: "textarea", required: true },
      { name: "cover_image_url", label: "Cover image URL" },
      { name: "published_at", label: "Publish date", type: "datetime" },
    ],
  },
  {
    key: "connection_groups",
    label: "Connection Groups",
    orderBy: { column: "name", ascending: true },
    titleField: "name",
    subtitle: (r) =>
      [r["meeting_day"], r["meeting_time"], r["location"], r["host_name"]]
        .filter(Boolean)
        .join(" · "),
    fields: [
      { name: "name", label: "Group name", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "meeting_day", label: "Meeting day" },
      { name: "meeting_time", label: "Meeting time" },
      { name: "location", label: "Location" },
      { name: "host_name", label: "Host" },
      { name: "age_focus", label: "Age focus" },
      { name: "capacity", label: "Capacity", type: "number" },
      { name: "is_open", label: "Open to new members", type: "checkbox" },
    ],
  },
];

export const SUBMISSION_TABLES: SubmissionTable[] = [
  {
    key: "contact_messages",
    label: "Messages",
    orderBy: { column: "created_at", ascending: false },
    statusOptions: ["new", "in_progress", "closed"],
    columns: [
      { name: "created_at", label: "Received" },
      { name: "name", label: "Name" },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "inquiry_type", label: "Type" },
      { name: "subject", label: "Subject" },
      { name: "message", label: "Message" },
    ],
  },
  {
    key: "prayer_requests",
    label: "Prayer requests",
    orderBy: { column: "created_at", ascending: false },
    statusOptions: ["new", "praying", "answered", "closed"],
    columns: [
      { name: "created_at", label: "Received" },
      { name: "name", label: "Name" },
      { name: "email", label: "Email" },
      { name: "request", label: "Request" },
    ],
  },
  {
    key: "visit_plans",
    label: "Planned visits",
    orderBy: { column: "created_at", ascending: false },
    statusOptions: ["new", "contacted", "visited", "closed"],
    columns: [
      { name: "created_at", label: "Received" },
      { name: "name", label: "Name" },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "adults", label: "Adults" },
      { name: "children", label: "Children" },
      { name: "accessibility_needs", label: "Accessibility" },
      { name: "prayer_request", label: "Prayer request" },
    ],
  },
  {
    key: "child_registrations",
    label: "Child registrations",
    orderBy: { column: "created_at", ascending: false },
    statusOptions: ["new", "reviewed", "approved"],
    columns: [
      { name: "created_at", label: "Received" },
      { name: "child_first_name", label: "Child" },
      { name: "child_age", label: "Age" },
      { name: "parent_name", label: "Parent" },
      { name: "parent_email", label: "Parent email" },
      { name: "parent_phone", label: "Parent phone" },
      { name: "allergies", label: "Allergies" },
      { name: "special_needs", label: "Special needs" },
    ],
  },
];
