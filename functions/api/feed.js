// YouTube RSS のプロキシ。ブラウザから直接fetchするとCORSで弾かれるため、
// 同一オリジンの /api/feed として中継する。エッジ＋ブラウザで1時間キャッシュ。
const FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCu74lmVvkIGiTR1AcXEOL-A';

export async function onRequest() {
  const upstream = await fetch(FEED, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!upstream.ok) return new Response('feed unavailable', { status: 502 });
  return new Response(await upstream.text(), {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
