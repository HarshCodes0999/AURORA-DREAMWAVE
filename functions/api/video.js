/* AURORA DREAMWAVE — YouTube video metadata */

export async function onRequestGet({ request }) {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  const respond = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: corsHeaders
    });

  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id");

  if (!/^[a-zA-Z0-9_-]{11}$/.test(id || "")) {
    return respond({ error: "Invalid YouTube video ID." }, 400);
  }

  const fallback = {
    id,
    title: `YouTube video (${id})`,
    channelTitle: "YouTube",
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  };

  try {
    const oembedUrl = new URL("https://www.youtube.com/oembed");
    oembedUrl.searchParams.set(
      "url",
      `https://www.youtube.com/watch?v=${id}`
    );
    oembedUrl.searchParams.set("format", "json");

    const response = await fetch(oembedUrl.toString());

    if (!response.ok) {
      return respond(fallback);
    }

    const data = await response.json();

    return respond({
      id,
      title: data.title || fallback.title,
      channelTitle: data.author_name || "YouTube",
      thumbnail: data.thumbnail_url || fallback.thumbnail
    });
  } catch {
    return respond(fallback);
  }
}
