const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function extractFromMusicaldown(tiktokUrl) {
  const html = await fetch("https://musicaldown.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: new URLSearchParams({ url: tiktokUrl, q: "auto" }),
  }).then((r) => r.text());

  const mp4 = html.match(/href\s*=\s*["'](https?:\/\/[^"']+\.mp4(?:\?[^"']*)?)["']/i)?.[1] ?? null;
  const mp3 = html.match(/href\s*=\s*["'](https?:\/\/[^"']+\.mp3(?:\?[^"']*)?)["']/i)?.[1] ?? null;

  if (!mp4) throw new Error("No download link found");
  return { mp4, mp3 };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (request.method === "POST") {
      try {
        const { url: tiktokUrl } = await request.json();

        if (!tiktokUrl?.includes("tiktok.com")) {
          return new Response(JSON.stringify({ error: "Invalid TikTok URL" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { mp4, mp3 } = await extractFromMusicaldown(tiktokUrl);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              title: "TikTok Video",
              author: "@user",
              thumbnail: "https://via.placeholder.com/300x300",
              videoUrl: mp4,
              audioUrl: mp3,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
