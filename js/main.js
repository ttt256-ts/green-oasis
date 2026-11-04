(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const form = document.getElementById('reserve');
  // 営業時間(0時からの分)と定休日(水曜)
  const OPEN = 480, LAST_ORDER = 1170, CLOSE = 1200, HOLIDAY = 3;
  const week = ['日', '月', '火', '水', '木', '金', '土'];
  const minutes = (d) => d.getHours() * 60 + d.getMinutes();
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // 本日のようす:営業状況・空席・今日採れた野菜を1分ごとに更新
  const openState = document.getElementById('open-state');
  if (openState) {
    const openNote = document.getElementById('open-note');
    const seatState = document.getElementById('seat-state');
    const seatMeter = document.getElementById('seat-meter');
    const seatNote = document.getElementById('seat-note');
    const vegToday = document.getElementById('veg-today');
    const vegFarm = document.getElementById('veg-farm');
    const SEATS = 24;
    // 空席は架空サイト用のデモ値:時間帯ごとの混み具合+10分ごとのゆらぎ
    // 実際の運用では、ここを予約・POSシステムの空席数に差し替える
    const busy = [.3, .4, .35, .55, .8, .75, .5, .5, .45, .4, .55, .45]; // 8時台〜19時台
    const wobble = (n) => { const x = Math.sin(n) * 10000; return x - Math.floor(x); };
    const vegs = [
      ['千葉農園', '小松菜・かぶ・にんじん'], ['茨城ファーム', 'トマト・バジル・ルッコラ'],
      ['千葉農園', 'ほうれん草・大根・春菊'], ['茨城ファーム', 'トマト・ディル・ミント'], ['千葉農園', 'れんこん・さつまいも・ケール'],
    ];
    const nextOpen = (now) => {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== HOLIDAY) return '明日 8:00 から営業します';
      d.setDate(d.getDate() + 1);
      return `${week[d.getDay()]}曜 8:00 から営業します`;
    };
    const render = () => {
      const now = new Date(), min = minutes(now);
      const holiday = now.getDay() === HOLIDAY;
      const open = !holiday && min >= OPEN && min < CLOSE;
      openState.textContent = holiday ? '本日定休日' : open ? '営業中' : '営業時間外';
      openState.classList.toggle('class189', !open);
      openNote.textContent = holiday || min >= CLOSE ? nextOpen(now)
        : min < OPEN ? '本日 8:00 から営業します'
        : min >= LAST_ORDER ? 'ラストオーダーは終了しました'
        : min >= LAST_ORDER - 30 ? `ラストオーダーまであと${LAST_ORDER - min}分`
        : '20:00まで(L.O. 19:30)';

      const used = open
        ? Math.min(SEATS, Math.max(0, Math.round(SEATS * busy[now.getHours() - 8] + (wobble(Math.floor(min / 10) + now.getDate() * 1000) - .5) * 6)))
        : 0;
      const left = SEATS - used;
      seatState.textContent = open ? `あと${left}席` : `全${SEATS}席`;
      seatMeter.hidden = !open;
      seatMeter.style.setProperty('--used', used);
      seatMeter.setAttribute('aria-label', `全${SEATS}席中${left}席が空いています`);
      seatNote.textContent = open
        ? `${left <= 3 ? '混み合っています' : left <= 10 ? 'やや混んでいます' : 'ゆったり過ごせます'}・${now.getHours()}:${pad(now.getMinutes())}時点`
        : 'カウンター10席';

      const [farm, items] = vegs[Math.floor(now.getTime() / 864e5) % vegs.length];
      vegToday.textContent = items;
      vegFarm.textContent = `${farm}から今朝届きました`;
    };
    render();
    setInterval(render, 60000);
  }

  // スクロールで、同じセクション内の要素を少しずつ遅らせて順番に表示する
  if (!reduce && 'IntersectionObserver' in window) {
    // キャッチを1文字ずつに分ける(改行はそのまま)
    const catchEl = document.querySelector('.class034');
    if (catchEl) {
      let i = 0;
      [...catchEl.childNodes].forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach((ch) => {
          const s = document.createElement('span');
          s.className = '、。'.includes(ch) ? 'class161 class197' : 'class161'; s.textContent = ch; s.style.setProperty('--i', i++);
          s.setAttribute('aria-hidden', 'true');
          frag.appendChild(s);
        });
        catchEl.replaceChild(frag, node);
      });
      catchEl.setAttribute('aria-label', catchEl.textContent);
    }

    // 予約フォームの中身に順番をつける
    if (form) [...form.children].forEach((el, n) => el.style.setProperty('--step', n));

    // 弧に沿った文字を、線の上をすべらせて定位置へ運ぶ
    const glide = (path, at) => {
      const end = parseFloat(path.getAttribute('startOffset')) || 0;
      const step = (now) => {
        const k = Math.min(Math.max((now - at) / 1600, 0), 1);
        path.setAttribute('startOffset', `${(end + 12 * (1 - k) ** 4).toFixed(2)}%`);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    // 上下の水玉の線を1粒ずつの点に分ける(画面上で34pxおき。点は伸び縮みしても丸のまま)
    // 画面幅が変わったら並べ直し、間隔がつまったり空いたりしないようにする
    document.querySelectorAll('.class032, .class153').forEach((svg) => {
      const path = svg.querySelector('path');
      if (!path) return;
      const group = document.createElementNS(path.namespaceURI, 'g');
      svg.append(group);
      svg.classList.add('class194');
      let lastW = 0, rt = 0;
      const layout = () => {
        const { width, height } = svg.getBoundingClientRect();
        if (!width || width === lastW) return;
        lastW = width;
        const settled = svg.classList.contains('class163'); // 表示済みなら、並べ直した点は弾ませない
        const sx = width / svg.viewBox.baseVal.width, sy = height / svg.viewBox.baseVal.height;
        // 線にそった画面上の長さを測り、両端に余白をとって点を均等に置く(端の点が欠けないように)
        const samples = [];
        let prev = path.getPointAtLength(0), along = 0;
        for (let l = 0, len = path.getTotalLength(); l <= len; l += 2) {
          const pt = path.getPointAtLength(l);
          along += Math.hypot((pt.x - prev.x) * sx, (pt.y - prev.y) * sy);
          prev = pt;
          samples.push([along, pt]);
        }
        const EDGE = 10, usable = along - EDGE * 2;
        const count = Math.max(2, Math.round(usable / 34) + 1), step = usable / (count - 1);
        const dots = [];
        for (let k = 0, j = 0; k < count; k++) {
          while (j < samples.length - 1 && samples[j][0] < EDGE + k * step) j++;
          const pt = samples[j][1];
          const dot = document.createElementNS(path.namespaceURI, 'path');
          dot.setAttribute('d', `M${pt.x.toFixed(1)} ${pt.y.toFixed(1)}h0`);
          dot.setAttribute('class', 'class193');
          dot.style.setProperty('--n', dots.length);
          if (settled) dot.style.animation = 'none';
          dots.push(dot);
        }
        group.replaceChildren(...dots);
      };
      layout();
      new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(layout, 150); }).observe(svg);
    });

    // FVのオープニング中に見えている要素は、オープニングが終わってから出す
    const heroEnd = performance.now() + (window.scrollY < window.innerHeight ? 4100 : 0);
    const nextStart = new WeakMap();
    const show = (target, now) => {
      const section = target.closest('section') || target;
      const start = Math.max(now, heroEnd, nextStart.get(section) || 0);
      nextStart.set(section, start + 160);
      target.style.setProperty('--reveal-delay', `${Math.round(start - now)}ms`);
      target.classList.add('class163');
      target.querySelectorAll(':is(.class060, .class073) textPath').forEach((path) => glide(path, start + 150));
      reveal.unobserve(target);
    };
    const reveal = new IntersectionObserver((entries) => {
      const now = performance.now();
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting || target.classList.contains('class163')) continue;
        // 前の兄弟がまだ出ていなければ、そちらを先に出して並び順どおりにする
        const queue = [target];
        for (let s = target.previousElementSibling; s?.matches('.class181:not(.class163)'); s = s.previousElementSibling) queue.unshift(s);
        queue.forEach((el) => show(el, now));
      }
    }, { threshold: 0.15 });
    document.querySelectorAll([
      '.class032', '.class182', '.class034', '.class031 .class036', '.class039', '.class051', '.class052', '.class054 li',
      '.class057', '.class059', '.class072', '.class077', '.class087', '.class090', '.class100', '.class106',
      '.class117', '.class119', '.class122', '.class131', '.class135', '.class153', '.class155', '.class049', '.class098',
    ].join(', ')).forEach((target) => {
      target.classList.add('class181');
      reveal.observe(target);
    });
  }

  if (!reduce && finePointer) {

    // FVロゴの「O」の目が、カーソルの方向を見る
    const eyes = document.querySelector('.class017');
    if (eyes) {
      const svg = eyes.ownerSVGElement;
      let raf = 0, mx = 0, my = 0;
      const look = () => {
        raf = 0;
        const box = svg.getBoundingClientRect();
        if (!box.width) return;
        const unit = box.width / 260;                    // viewBox 1 = 何px か
        const cx = box.left + 40.75 * unit, cy = box.top + 116 * unit; // 両目の真ん中
        const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(d / 160, 1) * 2.4;          // 目が動ける最大量(viewBox単位)
        eyes.style.transform = `translate(${(dx / d) * reach}px, ${(dy / d) * reach}px)`;
      };
      window.addEventListener('pointermove', (e) => {
        mx = e.clientX; my = e.clientY;
        if (!raf) raf = requestAnimationFrame(look);
      }, { passive: true });
    }

    // ホバーした瞬間、ボタンから小さな丸が左右にはじける
    const addHoverPops = (selector, className, offset, spread) => {
      document.querySelectorAll(selector).forEach((target) => {
        target.addEventListener('mouseenter', () => {
          if (target.disabled) return;
          for (const direction of [-1, 1]) {
            const pop = document.createElement('span');
            pop.className = className;
            pop.setAttribute('aria-hidden', 'true');
            pop.style.setProperty('--dx', `${direction * rnd(offset, offset + spread)}px`);
            pop.addEventListener('animationend', () => pop.remove(), { once: true });
            target.appendChild(pop);
          }
        });
      });
    };
    addHoverPops('.class028', 'class166', 10, 16);
  }

  // メニューカード:ボタンで裏返す
  const menuList = document.querySelector('.class091');
  menuList?.addEventListener('click', (event) => {
    const button = event.target.closest('.class180');
    if (!button) return;
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
  });

  // メニューカードを右から左へ流し続ける
  // 画面幅に合わせて必要な枚数だけ複製し、どの幅でも右端が途切れずにつながるようにする
  if (menuList && !reduce) {
    const originals = [...menuList.children];
    const SPEED = 42; // 1秒あたりに流れる px(どの画面幅でも同じ速さ)
    const makeClone = (li) => {
      const c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.classList.add('class168');
      c.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
      return c;
    };
    let builtFor = 0;
    const build = () => {
      const viewW = menuList.parentElement.clientWidth;
      // カード4枚分の長さ。測れないとき(非表示の瞬間など)は、今の複製を残したまま何もしない
      const setW = originals.reduce((sum, li) => sum + li.offsetWidth + parseFloat(getComputedStyle(li).marginRight), 0);
      if (!setW || !viewW || viewW === builtFor) return;
      builtFor = viewW;
      menuList.querySelectorAll('.class168').forEach((c) => c.remove());
      const reps = Math.max(1, Math.ceil((viewW + 40) / setW)); // 表示幅を埋めるのに必要なセット数
      // 前半(元の4枚+複製)と後半(まったく同じ並び)を用意して -50% でつなぎ目なくループ
      for (let r = 1; r < reps * 2; r++) originals.forEach((li) => menuList.appendChild(makeClone(li)));
      menuList.style.setProperty('--flow-dur', `${(setW * reps / SPEED).toFixed(1)}s`);
    };
    build();
    const pause = document.querySelector('.class190');
    if (pause) {
      pause.hidden = false;
      pause.addEventListener('click', () => {
        const paused = pause.getAttribute('aria-pressed') !== 'true';
        pause.setAttribute('aria-pressed', String(paused));
        pause.textContent = paused ? '再生' : '一時停止';
        menuList.classList.toggle('class191', paused);
      });
    }
    // 表示幅が変わったときだけ作り直す(スマホのアドレスバー伸縮のような高さだけの変化では作り直さない)
    let rt = 0;
    new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(build, 150); }).observe(menuList.parentElement);
  }

  // 予約フォーム:選んだ内容にあわせて、ひとことと吹き出しを出す
  // 過去の日付・定休日・受付の終わった時間は選べないようにし、そのあいだはボタンを押せなくする
  if (form) {
    const dateEl = form.querySelector('[name="date"]');
    const timeEl = form.querySelector('[name="time"]');
    const pplEl = form.querySelector('[name="people"]');
    const btn = form.querySelector('.class152');
    const hint = (el) => el.closest('.class138').querySelector('.class143');
    const summary = form.querySelector('.class151');
    const day = () => new Date(`${dateEl.value}T00:00`);
    const dateText = () => {
      const d = day();
      return `${d.getMonth() + 1}月${d.getDate()}日(${week[d.getDay()]})`;
    };
    // 今日なら、過ぎた時間を選択肢から外す。残りがなければ true
    const syncTimes = () => {
      const now = new Date();
      const today = dateEl.value === isoDate(now);
      const options = [...timeEl.options];
      options.forEach((o) => { o.hidden = o.disabled = today && parseInt(o.value, 10) * 60 <= minutes(now); });
      if (timeEl.selectedOptions[0]?.disabled) timeEl.value = options.find((o) => !o.disabled)?.value ?? '';
      return options.every((o) => o.disabled);
    };
    const status = () => {
      if (!dateEl.value) return 'empty';
      if (dateEl.value < isoDate(new Date())) return 'past';
      if (day().getDay() === HOLIDAY) return 'holiday';
      return syncTimes() ? 'full' : 'ok';
    };
    const dateHint = {
      empty: () => 'カレンダーから日にちを選んでください',
      past: () => '過去の日付は選べません',
      holiday: () => '水曜日は定休日です。前後の日はいかがですか?',
      full: () => '本日の受付は終了しました。明日以降をお選びください',
      ok: () => ([0, 6].includes(day().getDay()) ? `${dateText()}、週末のごほうびランチに` : `${dateText()}、平日のひと休みに`),
    };
    const blocked = {
      empty: () => '日にちを選んでください',
      past: () => '過去の日付です',
      holiday: () => `${dateText()}は定休日です`,
      full: () => '本日の受付は終了しました',
    };
    const timeHint = () => {
      const h = parseInt(timeEl.value, 10);
      if (h <= 10) return 'モーニング:グリーンスムージーで1日をスタート';
      if (h <= 14) return 'ランチ:季節のサラダボウルが人気です';
      if (h <= 17) return 'カフェタイム:本日のデザートと一緒にひと息';
      return '夜カフェ:L.O. 19:30 まで、ゆっくりどうぞ';
    };
    const pplHint = () => ({
      '1名': 'ひとりでも大歓迎。カウンター席もあります',
      '2名': '2人がけの席で、ゆっくりおしゃべりを',
      '3名': 'テーブル席をご用意します',
      '4名': 'テーブル席をご用意します',
    }[pplEl.value] || '大人数のときは、お電話でもご相談ください');
    const pop = (el) => { el.classList.remove('class173'); void el.offsetWidth; el.classList.add('class173'); };
    const update = (changed) => {
      const state = status();
      const ok = state === 'ok';
      hint(dateEl).textContent = dateHint[state]();
      hint(timeEl).textContent = ok ? timeHint() : '';
      hint(pplEl).textContent = pplHint();
      const m = document.createElement('span'); m.className = 'class169';
      m.textContent = ok ? `${dateText()} ${timeEl.value}〜 ${pplEl.value}さま` : blocked[state]();
      const s2 = document.createElement('span'); s2.className = 'class170'; s2.textContent = ok ? 'お待ちしています' : 'ほかの日をお選びください';
      summary.replaceChildren(m, s2);
      summary.parentElement.classList.toggle('class171', !ok);
      btn.disabled = !ok;
      if (changed) {
        changed.closest('.class138').classList.add('class172');
        pop(hint(changed));
        pop(summary.parentElement);
      }
    };
    // 初期値:今日(受付が終わっていれば次の営業日)。過去の日付はカレンダーで選べない
    const start = new Date();
    if (minutes(start) >= LAST_ORDER - 30) start.setDate(start.getDate() + 1);
    while (start.getDay() === HOLIDAY) start.setDate(start.getDate() + 1);
    dateEl.min = isoDate(new Date());
    dateEl.value = isoDate(start);
    [dateEl, timeEl, pplEl].forEach((el) => {
      el.addEventListener('change', () => update(el));
      el.addEventListener('input', () => update(el));
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (status() !== 'ok') return update();
      alert('このサイトは架空のカフェのため、実際のご予約はできません。');
    });
    update();
    setInterval(() => update(), 60000); // 時間がたって過ぎた時間を選択肢から外す
  }

  // SPメニュー開閉
  const toggle = document.querySelector('.class004');
  const nav = document.getElementById('gnav');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      nav.classList.toggle('class175', open);
      document.documentElement.classList.toggle('class176', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    window.matchMedia('(max-width: 900px)').addEventListener('change', (event) => {
      if (!event.matches) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // お客さまの声の星:5つに分けて、1つずつぽんっと出す
  if (!reduce) {
    document.querySelectorAll('.class111').forEach((stars) => {
      stars.classList.add('class205');
      stars.append(...[0, 1, 2, 3, 4].map((n) => {
        const star = document.createElement('span');
        star.className = 'class204';
        star.style.setProperty('--n', n);
        return star;
      }));
    });
  }

  // FVのスライド:最初のひと回りは早めに切り替えてすぐ伝わるように、2周目からはゆっくり
  // 丸ボタンで選べ、写真にふれている間は止まる
  const slides = [...document.querySelectorAll('.class198')];
  const slideDots = [...document.querySelectorAll('.class201')];
  if (slides.length > 1) {
    const hero = slides[0].parentElement;
    let current = 0, timer = 0, count = 0, hovered = false, focused = false;
    const show = (n) => {
      current = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('class199', i === current));
      slideDots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
    };
    // 写真にふれている・ボタンを選んでいる・タブが裏にある間は止める
    const play = () => {
      clearTimeout(timer);
      if (reduce || hovered || focused || document.hidden) return;
      timer = setTimeout(() => { count += 1; show(current + 1); play(); }, count < slides.length ? 2000 : 5000);
    };
    slideDots.forEach((dot, i) => dot.addEventListener('click', () => { count = slides.length; show(i); play(); }));
    hero.addEventListener('pointerenter', (e) => { hovered = e.pointerType === 'mouse'; play(); });
    hero.addEventListener('pointerleave', () => { hovered = false; play(); });
    hero.addEventListener('focusin', () => { focused = true; play(); });
    hero.addEventListener('focusout', () => { focused = false; play(); });
    document.addEventListener('visibilitychange', play);
    setTimeout(play, reduce ? 0 : 3400); // 1枚目が見えてきたら動かし始める
  }

  // トップへ戻るボタン:ファーストビューを過ぎたら出す
  const toTop = document.querySelector('.class195');
  if (toTop) {
    const sync = () => toTop.classList.toggle('class196', window.scrollY < window.innerHeight * 0.6);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
  }

  // Q&A:高さをなめらかに変えて開閉し、1つ開いたら他を閉じる
  const faqs = [...document.querySelectorAll('.class119')];
  const running = new WeakMap();
  const isOpen = (d) => running.get(d)?.open ?? d.open;
  const setOpen = (d, open) => {
    if (reduce) { d.open = open; return; }
    running.get(d)?.anim.cancel();
    const from = d.offsetHeight;
    d.open = true; // 開いた状態で高さを測る
    const to = open ? d.offsetHeight : d.querySelector('summary').offsetHeight + d.offsetHeight - d.clientHeight;
    const anim = d.animate({ height: [`${from}px`, `${to}px`] }, { duration: 400, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    running.set(d, { anim, open });
    d.classList.toggle('class192', !open); // 閉じている途中(見た目は先に閉じた状態にする)
    anim.onfinish = () => { d.open = open; d.classList.remove('class192'); running.delete(d); };
  };
  faqs.forEach((d) => d.querySelector('summary').addEventListener('click', (event) => {
    event.preventDefault();
    const open = !isOpen(d);
    if (open) faqs.forEach((o) => { if (o !== d && isOpen(o)) setOpen(o, false); });
    setOpen(d, open);
  }));

  // 画像が未配置のときはファイル名入りのプレースホルダーを表示
  const markMissing = (img) => {
    const box = img.closest('.class011');
    if (!box) return;
    box.classList.add('class177');
    box.dataset.missing = img.getAttribute('src').split('/').pop();
  };
  document.querySelectorAll('.class011 > img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    else img.addEventListener('error', () => markMissing(img), { once: true });
  });

  // SVG内の写真(外観)も、未配置なら壊れた画像アイコンを出さない
  document.querySelectorAll('svg image').forEach((el) => {
    const probe = new Image();
    probe.onerror = () => el.remove();
    probe.src = el.getAttribute('href');
  });
})();
