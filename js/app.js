/* JP RECORDS — songs.json（シード）＋ YouTube RSS（/api/feed 経由）をマージして描画。
   RSSは最新15件しか持たないため、シードにない新曲だけを先頭に足す。 */

const CHANNEL_URL = 'https://www.youtube.com/@JP-ow2gi';

const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = s => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '';
const thumb = id => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

/* RSSタイトル → 表示タイトル（songs.json生成時と同じ規則） */
function displayTitle(t) {
  return t
    .replace(/\s*[—–-]+\s*JP\s*$/, '')
    .replace(/【AI MUSIC】\s*$/, '')
    .replace(/^【[^】]*】/, '')
    .replace(/【(オリジナル|カバー)[^】]*】\s*$/, '')
    .trim();
}

function parseFeed(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return [...doc.getElementsByTagName('entry')].flatMap(en => {
    const get = tag => en.getElementsByTagName(tag)[0]?.textContent ?? '';
    const link = en.querySelector('link[rel="alternate"]')?.getAttribute('href') ?? '';
    const title = get('title');
    if (link.includes('/shorts/') || /#short/i.test(title)) return []; // Shortsは載せない
    const id = get('yt:videoId') || get('videoId');
    return id ? [{ id, dt: displayTitle(title), era: 'suno', dur: null, c: '#8a7a66' }] : [];
  });
}

async function load() {
  const [songs, feedXml] = await Promise.all([
    fetch('songs.json').then(r => r.json()),
    fetch('/api/feed').then(r => (r.ok ? r.text() : null)).catch(() => null),
  ]);
  if (feedXml) {
    const known = new Set(songs.map(s => s.id));
    const fresh = parseFeed(feedXml).filter(s => !known.has(s.id));
    songs.unshift(...fresh); // RSSは新しい順なのでそのまま先頭へ
  }
  render(songs);
}

function render(songs) {
  const latest = songs[0];

  document.getElementById('pick').innerHTML = `
    <div class="sleeve">
      <div class="sq">
        <img class="bg" src="${thumb(latest.id)}" alt="" aria-hidden="true">
        <img class="fg" src="https://i.ytimg.com/vi/${latest.id}/maxresdefault.jpg"
             onerror="this.src='${thumb(latest.id)}';this.onerror=null" alt="${esc(latest.dt)}">
      </div>
      <div class="pop">NEW!</div>
    </div>
    <div class="txt">
      <div class="label">STAFF PICK — 最新リリース</div>
      <h2>${esc(latest.dt)}</h2>
      <div class="meta">${fmt(latest.dur)} / JP</div>
      <a href="https://youtu.be/${latest.id}" data-i="0">▶ 試聴する</a>
    </div>`;
  document.querySelector('#pick .txt a').addEventListener('click', e => {
    e.preventDefault();
    open(songs[0]);
  });

  const bins = { suno: [], voca: [] };
  songs.forEach((s, i) => bins[s.era]?.push(
    `<div class="rec" tabindex="0" data-i="${i}">
      <div class="vinyl" style="--dom:${s.c}"></div>
      <div class="sq">
        <img class="bg" src="${thumb(s.id)}" alt="" aria-hidden="true" loading="lazy" decoding="async">
        <img class="fg" src="${thumb(s.id)}" alt="${esc(s.dt)}" loading="lazy" decoding="async">
      </div>
      <div class="t">${esc(s.dt)}</div>
    </div>`
  ));
  document.getElementById('bin-suno').innerHTML = bins.suno.join('');
  document.getElementById('bin-voca').innerHTML = bins.voca.join('');
  document.getElementById('c-suno').textContent = `${bins.suno.length}枚`;
  document.getElementById('c-voca').textContent = `${bins.voca.length}枚`;

  /* modal（YouTube埋め込み再生） */
  const modal = document.getElementById('modal');
  const player = document.getElementById('mplayer');
  let lastFocus = null;

  function open(s) {
    lastFocus = document.activeElement;
    player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${s.id}?autoplay=1&rel=0"
      title="${esc(s.dt)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    document.getElementById('mt').textContent = s.dt;
    document.getElementById('mm').textContent =
      `${fmt(s.dur)}${s.era === 'voca' ? (s.dur ? ' / ' : '') + 'VOCALOID ERA' : ''}`;
    document.getElementById('ml').href = `https://youtu.be/${s.id}`;
    modal.classList.add('open');
    document.getElementById('mx').focus();
  }
  function close() {
    modal.classList.remove('open');
    player.innerHTML = ''; // iframeを消して再生を止める
    lastFocus && lastFocus.focus();
  }
  document.querySelectorAll('.bin').forEach(bin => {
    bin.addEventListener('click', e => {
      const t = e.target.closest('.rec');
      t && open(songs[+t.dataset.i]);
    });
    bin.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const t = e.target.closest('.rec');
        t && open(songs[+t.dataset.i]);
      }
    });
  });
  document.getElementById('mx').onclick = close;
  modal.onclick = e => { if (e.target === modal) close(); };
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
}

load();
