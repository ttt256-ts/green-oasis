// Green Oasis LP
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // キャッチのじんわり表示・予約フォームの段階表示
  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');

    // キャッチを1文字ずつに分ける(改行はそのまま)
    const catchEl = document.querySelector('.intro__title');
    const subEl = document.querySelector('.intro .lined');
    if (catchEl) {
      let i = 0;
      [...catchEl.childNodes].forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach((ch) => {
          const s = document.createElement('span');
          s.className = 'char'; s.textContent = ch; s.style.setProperty('--i', i++);
          s.setAttribute('aria-hidden', 'true');
          frag.appendChild(s);
        });
        catchEl.replaceChild(frag, node);
      });
      catchEl.setAttribute('aria-label', catchEl.textContent);
      const lineDelay = i * 0.045 + 0.45;                         // キャッチが出そろう少し前に線が伸び始める
      if (subEl) subEl.style.setProperty('--line-delay', `${lineDelay.toFixed(2)}s`);
      catchEl.dataset.pointsAfter = (lineDelay + 1.1).toFixed(2); // サブキャッチが出終わるまでの秒数
      const pts = document.querySelector('.points');
      if (pts) [...pts.children].forEach((li, n) => li.style.setProperty('--n', n));
    }
    if (subEl) {
      const t = document.createElement('span');
      t.className = 'lined__text'; t.textContent = subEl.textContent.trim();
      subEl.textContent = ''; subEl.appendChild(t);
    }

    // 予約フォームの中身に順番をつける
    const form = document.querySelector('.reserve');
    if (form) [...form.children].forEach((el, n) => el.style.setProperty('--step', n));

    const once = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        if (e.target === catchEl) {
          if (subEl) subEl.classList.add('is-in');
          catchEl.dataset.startedAt = performance.now();
        }
        once.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    [catchEl, form].forEach((el) => el && once.observe(el));

    // 緑の丸3つは、自分が画面に入ったときに登場(キャッチがまだ出ている途中なら、出終わるのを待ってから)
    const pts = document.querySelector('.points');
    if (pts && catchEl) {
      const ptsIO = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        const started = Number(catchEl.dataset.startedAt || performance.now());
        const wait = Math.max(0.15, Number(catchEl.dataset.pointsAfter || 0) - (performance.now() - started) / 1000);
        pts.style.setProperty('--points-delay', `${wait.toFixed(2)}s`);
        pts.classList.add('is-in');
        ptsIO.disconnect();
      }, { threshold: 0.35 });
      ptsIO.observe(pts);
    }
  }

  // スクロールで、各セクションのタイトルだけ左上から傾いてふわっと登場
  if (!reduce && 'IntersectionObserver' in window) {
    const titles = document.querySelectorAll('.features .sec-head, .menu .sec-head, .producers .sec-head, .voice .sec-head, .qa .sec-head, .news .sec-head');
    titles.forEach((el) => el.classList.add('reveal'));
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
    titles.forEach((el) => io.observe(el));
  }

  if (!reduce && finePointer) {
    // カーソルを動かすと、コーヒーの湯気のような白い煙がゆらゆら昇って消える
    const cv = document.createElement('canvas');
    cv.className = 'cursor-steam';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit(); window.addEventListener('resize', fit);

    const puffs = [];
    let px = null, py = null, acc = 0, running = false;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const frame = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.t += 1;
        const k = p.t / p.life;
        if (k >= 1) { puffs.splice(i, 1); continue; }
        // ゆっくり上へ昇りながら、左右にゆらゆら
        p.y -= p.rise * (1 - k * 0.5);
        const x = p.x + Math.sin(p.t * p.freq + p.phase) * p.sway * k;
        const r = p.r0 + (p.r1 - p.r0) * Math.sqrt(k);
        const a = (k < 0.18 ? k / 0.18 : 1 - (k - 0.18) / 0.82) * p.alpha;
        const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, r);
        g.addColorStop(0, `rgba(255, 255, 252, ${a})`);
        g.addColorStop(0.45, `rgba(236, 230, 218, ${a * 0.55})`);   // クリーム色の背景でもうっすら見える
        g.addColorStop(1, 'rgba(225, 218, 205, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, p.y, r, 0, Math.PI * 2); ctx.fill();
      }
      if (puffs.length) requestAnimationFrame(frame); else running = false;
    };
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const x = e.clientX, y = e.clientY;
      if (px !== null) acc += Math.hypot(x - px, y - py);
      px = x; py = y;
      if (acc < 22) return;   // 少し動くごとに、ひとすじずつ
      acc = 0;
      if (puffs.length > 60) puffs.shift();
      puffs.push({
        x: x + rnd(-3, 3), y: y + 4, t: 0, life: rnd(70, 110),
        r0: rnd(5, 8), r1: rnd(20, 32), rise: rnd(0.45, 0.8),
        sway: rnd(6, 12), freq: rnd(0.04, 0.07), phase: rnd(0, 6.28), alpha: rnd(0.32, 0.5),
      });
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });
    document.addEventListener('mouseleave', () => { px = py = null; });

    // FVロゴの「O」の目が、カーソルの方向を見る
    const eyes = document.querySelector('.logo-face__eyes');
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

    // 「席を予約する」ボタンにホバーした瞬間、上から葉っぱが2枚ぴょこっと飛び出す
    document.querySelectorAll('.btn--reserve').forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        [-1, 1].forEach((dir) => {
          const p = document.createElement('span');
          p.className = 'btn-pop';
          p.style.setProperty('--dx', `${dir * (28 + Math.random() * 18)}px`);
          p.style.setProperty('--rot', `${dir * (90 + Math.random() * 140)}deg`);
          btn.appendChild(p);
          p.addEventListener('animationend', () => p.remove(), { once: true });
        });
      });
    });

    // ナビにホバーした瞬間、小さな葉っぱが2枚はじけて落ちる
    document.querySelectorAll('.gnav__list a').forEach((a) => {
      a.addEventListener('mouseenter', () => {
        [-1, 1].forEach((dir) => {
          const p = document.createElement('span');
          p.className = 'nav-pop';
          p.style.setProperty('--dx', `${dir * (18 + Math.random() * 10)}px`);
          p.style.setProperty('--rot', `${dir * (120 + Math.random() * 120)}deg`);
          a.appendChild(p);
          p.addEventListener('animationend', () => p.remove(), { once: true });
        });
      });
    });
  }

  // メニューカードを右から左へ流し続ける
  // 画面幅に合わせて必要な枚数だけ複製し、どの幅でも右端が途切れずにつながるようにする
  const menuList = document.querySelector('.menu__list');
  if (menuList) {
    const originals = [...menuList.children];
    const SPEED = 42; // 1秒あたりに流れる px(どの画面幅でも同じ速さ)
    const makeClone = (li) => {
      const c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.classList.add('is-clone');
      c.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
      return c;
    };
    const build = () => {
      menuList.querySelectorAll('.is-clone').forEach((c) => c.remove());
      const setW = menuList.scrollWidth;                           // カード4枚分の長さ
      const reps = Math.max(1, Math.ceil((window.innerWidth + 40) / setW)); // 画面幅を埋めるのに必要なセット数
      // 前半(元の4枚+複製)と後半(まったく同じ並び)を用意して -50% でつなぎ目なくループ
      for (let r = 1; r < reps * 2; r++) originals.forEach((li) => menuList.appendChild(makeClone(li)));
      const half = setW * reps;
      menuList.style.setProperty('--flow-dur', `${(half / SPEED).toFixed(1)}s`);
    };
    build();
    let rt = 0, lastW = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastW) return;   // スマホのアドレスバー伸縮(縦だけの変化)では作り直さない
      lastW = window.innerWidth;
      clearTimeout(rt); rt = setTimeout(build, 200);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build); // フォント読み込み後の幅で計算し直す
  }

  // 予約フォーム:選んだ内容にあわせて、ひとことと吹き出しを出す
  const rForm = document.querySelector('.reserve');
  if (rForm) {
    const dateEl = rForm.querySelector('[name="date"]');
    const timeEl = rForm.querySelector('[name="time"]');
    const pplEl = rForm.querySelector('[name="people"]');
    const hint = (el) => el.closest('.field').querySelector('.field__hint');
    const summary = rForm.querySelector('.reserve__summary-text');
    const btn = rForm.querySelector('.reserve__btn');
    const week = ['日', '月', '火', '水', '木', '金', '土'];
    const dateText = () => {
      if (!dateEl.value) return '';
      const d = new Date(`${dateEl.value}T00:00`);
      return `${d.getMonth() + 1}月${d.getDate()}日(${week[d.getDay()]})`;
    };
    const dateHint = () => {
      if (!dateEl.value) return 'カレンダーから日にちを選んでください';
      const d = new Date(`${dateEl.value}T00:00`);
      if (d.getDay() === 3) return '水曜日は定休日です。前後の日はいかがですか?';
      return [0, 6].includes(d.getDay()) ? `${dateText()}、週末のごほうびランチに` : `${dateText()}、平日のひと休みに`;
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
    const pop = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    const update = (changed) => {
      hint(dateEl).textContent = dateHint();
      hint(timeEl).textContent = timeHint();
      hint(pplEl).textContent = pplHint();
      const closed = dateEl.value && new Date(`${dateEl.value}T00:00`).getDay() === 3;
      const [main, sub] = closed
        ? [`${dateText()}は定休日です`, 'ほかの日をお選びください']
        : [`${dateText()} ${timeEl.value}〜 ${pplEl.value}さま`, 'お待ちしています'];
      summary.innerHTML = '';
      const m = document.createElement('span'); m.className = 'reserve__summary-main'; m.textContent = main;
      const s2 = document.createElement('span'); s2.className = 'reserve__summary-sub'; s2.textContent = sub;
      summary.append(m, s2);
      summary.parentElement.classList.toggle('is-closed', !!closed);
      if (changed) {
        changed.closest('.field').classList.add('is-touched');
        pop(hint(changed), 'is-pop');
        pop(summary.parentElement, 'is-pop');
        pop(btn, 'is-nudge');
      }
    };
    [dateEl, timeEl, pplEl].forEach((el) => {
      el.addEventListener('change', () => update(el));
      el.addEventListener('input', () => update(el));
    });
    btn.addEventListener('animationend', (e) => { if (e.animationName === 'btn-nudge') btn.classList.remove('is-nudge'); });
    update();
  }

  // SPメニュー開閉
  const toggle = document.querySelector('.header__toggle');
  const nav = document.getElementById('gnav');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  // Q&A:1つ開いたら他を閉じる
  const faqs = document.querySelectorAll('.faq');
  faqs.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
  }));

  // 画像が未配置のときはファイル名入りのプレースホルダーを表示
  const markMissing = (img) => {
    const box = img.closest('.ph');
    if (!box) return;
    box.classList.add('is-missing');
    box.dataset.missing = img.getAttribute('src').split('/').pop();
  };
  document.querySelectorAll('.ph > img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    else img.addEventListener('error', () => markMissing(img), { once: true });
  });

  // SVG内の写真(外観)も、未配置なら壊れた画像アイコンを出さない
  document.querySelectorAll('svg image').forEach((el) => {
    const probe = new Image();
    probe.onerror = () => el.remove();
    probe.src = el.getAttribute('href');
  });

  // 予約フォーム(送信先が決まるまでのダミー)
  const form = document.getElementById('reserve');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('予約画面へ進みます(送信先は未設定です)');
    });
  }
})();
