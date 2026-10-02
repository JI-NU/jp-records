# JP RECORDS

AI音楽クリエイター JP のディスコグラフィーサイト。レコード店の木箱にジャケが並ぶ。

- **本番**: Cloudflare Pages（masterへpush＝自動デプロイ）
- **曲データ**: `songs.json`（全曲・これが正）＋ YouTube RSS（`/api/feed` 経由・最新15件）をクライアントでマージ。
  **RSSは補助であって当てにしない**。YouTube側が断続的に404を返すうえ、1曲につき本編＋Shortsで
  2枠使うため実質7曲分の窓しかなく、放置すると取りこぼす（2026-10で37曲の欠落が発生）
- **Shorts除外**: タイトル `#short` / URL `/shorts/` はグリッドに載せない
- **サムネ**: i.ytimg.com を直接参照（画像はホスティングしない）
- **メンテ**: 新曲を出したら `python3 ../tools/update_songs.py --write` を回して `songs.json` を更新する。
  yt-dlp で全曲取得し、既存エントリは一切書き換えず新規ぶんだけ追記する（`--write` 無しで差分確認）
