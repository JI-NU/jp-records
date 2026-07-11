# JP RECORDS

AI音楽クリエイター JP のディスコグラフィーサイト。レコード店の木箱にジャケが並ぶ。

- **本番**: Cloudflare Pages（masterへpush＝自動デプロイ）
- **曲データ**: `songs.json`（シード・全曲）＋ YouTube RSS（`/api/feed` 経由・最新15件）をクライアントでマージ。
  YouTubeに新曲をアップすると最大1時間で自動掲載される
- **Shorts除外**: タイトル `#short` / URL `/shorts/` はグリッドに載せない
- **サムネ**: i.ytimg.com を直接参照（画像はホスティングしない）
- **メンテ**: RSSは15件しか持たないため、新曲が15曲たまる前に `songs.json` へ追記する
  （追記スクリプトの正: `../design.md` 参照。yt-dlp `--flat-playlist` で再生成可能）
