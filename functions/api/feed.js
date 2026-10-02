// YouTube RSS のプロキシ。ブラウザから直接fetchするとCORSで弾かれるため、
// 同一オリジンの /api/feed として中継する。
//
// YouTube の RSS は断続的に 404/500 を返す（2026-10-02 実測で成功率 27%）。
// 以前は cacheTtl:3600 + cacheEverything でステータスを問わずキャッシュしていたため、
// 一度 404 を掴むと YouTube が回復しても1時間 502 を返し続けていた。
// 成功レスポンスだけをキャッシュし、失敗時は数回リトライする。
const FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCu74lmVvkIGiTR1AcXEOL-A';
const ATTEMPTS = 4;

export async function onRequest() {
  let status = 0;

  for (let i = 0; i < ATTEMPTS; i++) {
    let upstream;
    try {
      upstream = await fetch(FEED, {
        cf: {
          cacheEverything: true,
          // 成功だけ1時間キャッシュ。エラーはキャッシュしない（次の要求で再挑戦できる）
          cacheTtlByStatus: { '200-299': 3600, '300-399': 0, '400-499': 0, '500-599': 0 },
        },
      });
    } catch (e) {
      status = -1; // ネットワーク層の失敗
      continue;
    }

    if (upstream.ok) {
      return new Response(await upstream.text(), {
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }
    status = upstream.status;
  }

  // 全滅。ブラウザ側にキャッシュさせず、次の読み込みで再挑戦させる。
  // songs.json に全曲入っているため、ここが失敗してもサイトの表示は欠けない。
  return new Response(`feed unavailable (upstream ${status} after ${ATTEMPTS} attempts)`, {
    status: 502,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  });
}
