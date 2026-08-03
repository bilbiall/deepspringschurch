/** Loaders must never crash the page when a content fetch fails (offline,
 * cold start, transient network). Fall back to empty data instead. */
export async function safeLoad<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (error) {
    console.error("Content load failed", error);
    return fallback;
  }
}
