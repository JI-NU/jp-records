// 正規ドメインへの301リダイレクト。
// - jp-records.pages.dev（完全一致）→ jp-records.com。ブランチプレビュー
//   (<hash>.jp-records.pages.dev) は動作確認用に生かしておく。
// - www.jp-records.com → jp-records.com（正規URLをapexに一本化）
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'jp-records.pages.dev' || url.hostname === 'www.jp-records.com') {
    url.hostname = 'jp-records.com';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
