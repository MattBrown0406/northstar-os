import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the website HTML
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandExtractor/1.0)" },
    });
    const html = await response.text();

    // Extract colors from CSS, meta tags, and inline styles
    const colors: string[] = [];

    // Look for theme-color meta tag
    const themeColorMatch = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);
    if (themeColorMatch) colors.push(themeColorMatch[1]);

    // Look for msapplication-TileColor
    const tileColorMatch = html.match(/<meta[^>]*name=["']msapplication-TileColor["'][^>]*content=["']([^"']+)["']/i);
    if (tileColorMatch) colors.push(tileColorMatch[1]);

    // Extract hex colors from inline styles and CSS
    const hexMatches = html.match(/#[0-9a-fA-F]{6}\b/g) || [];
    const rgbMatches = html.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g) || [];

    // Count color frequency
    const colorFreq: Record<string, number> = {};
    for (const c of hexMatches) {
      const normalized = c.toLowerCase();
      // Skip near-white, near-black, and grays
      if (isNeutral(normalized)) continue;
      colorFreq[normalized] = (colorFreq[normalized] || 0) + 1;
    }

    // Sort by frequency
    const sorted = Object.entries(colorFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color);

    // Combine: theme-color first, then most frequent
    const allColors = [...new Set([...colors, ...sorted])].slice(0, 5);

    // Try to extract logo
    let logoUrl = null;
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      logoUrl = ogImageMatch[1];
      if (logoUrl.startsWith("/")) {
        const urlObj = new URL(url);
        logoUrl = `${urlObj.origin}${logoUrl}`;
      }
    }

    // Extract site name
    let siteName = null;
    const ogSiteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (ogSiteNameMatch) siteName = ogSiteNameMatch[1];
    if (!siteName) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) siteName = titleMatch[1].split(/[|\-–—]/)[0].trim();
    }

    return new Response(JSON.stringify({
      colors: allColors,
      primary: allColors[0] || "#14B8A6",
      secondary: allColors[1] || "#F97316",
      logo_url: logoUrl,
      site_name: siteName,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Brand extraction error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function isNeutral(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Check if it's very light, very dark, or gray
  const avg = (r + g + b) / 3;
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  if (avg > 230 || avg < 25) return true; // near white/black
  if (maxDiff < 20) return true; // gray
  return false;
}
