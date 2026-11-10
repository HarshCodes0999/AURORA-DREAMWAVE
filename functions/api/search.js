export async function onRequestGet(context) {
  const key = context.env.YOUTUBE_API_KEY;

  if (!key) {
    return Response.json(
      { error: "Search service is not configured yet." },
      { status: 503 }
    );
  }

  const url = new URL(context.request.url);
  const query = (url.searchParams.get("q") || "").trim();

  if (query.length < 2 || query.length > 100) {
    return Response.json(
      { error: "Enter a search term between 2 and 100 characters." },
      { status: 400 }
    );
  }

  const apiURL = new URL(
    "https://www.googleapis.com/youtube/v3/search"
  );

  apiURL.search = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    videoEmbeddable: "true",
    safeSearch: "moderate",
    regionCode: "IN",
    maxResults: "10",
    key
  });

  try {
    const response = await fetch(apiURL.toString());

    if (!response.ok) {
      return Response.json(
        { error: "YouTube search is temporarily unavailable." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const results = (data.items || [])
      .filter(item => item.id?.videoId)
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet?.title || "Untitled",
        channelTitle: item.snippet?.channelTitle || "YouTube",
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          ""
      }));

    return Response.json(
      { results },
      {
        headers: {
          "Cache-Control": "public, max-age=60"
        }
      }
    );
  } catch {
    return Response.json(
      { error: "Could not connect to YouTube. Try again." },
      { status: 502 }
    );
  }
}
