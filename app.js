// Campaign settings: change these two lines if the number or date changes.
const WHATSAPP = '971556961826';
const VOTE_DAY = new Date(2026, 9, 15); // Thursday, 15 October 2026

const SITE = 'https://vote-shabbir.vercel.app/';
const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const $ = (s) => document.querySelector(s);
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero tilt: the stage leans with the mouse or the phone, and sways on its own until someone steers it
(() => {
  const stage = $('.stage');
  const hint = $('#tiltHint');
  if (calm) return;
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  let x = 0, y = 0, goalX = 0, goalY = 0;
  let steered = -1e9, gyro = false, visible = true, raf = 0;

  const frame = (t) => {
    raf = 0;
    if (!visible) return;
    if (!gyro && t - steered > 1800) {
      goalX = Math.sin(t / 1700) * 0.6;
      goalY = Math.sin(t / 2300 + 1) * 0.4;
    }
    x += (goalX - x) * 0.09;
    y += (goalY - y) * 0.09;
    stage.style.setProperty('--tx', x.toFixed(3));
    stage.style.setProperty('--ty', y.toFixed(3));
    raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }).observe(stage);

  $('.hero').addEventListener('pointermove', (e) => {
    if (gyro || e.pointerType === 'touch') return;
    const r = stage.getBoundingClientRect();
    goalX = clamp((e.clientX - r.left - r.width / 2) / (innerWidth / 2));
    goalY = clamp((e.clientY - r.top - r.height / 2) / (innerHeight / 2));
    steered = performance.now();
  });

  // Phone motion. The neutral position drifts slowly towards however the phone is being held.
  let restG = null, restB = null;
  const onTilt = (e) => {
    if (e.gamma == null || e.beta == null) return;
    if (restG === null) { restG = e.gamma; restB = e.beta; gyro = true; hint.hidden = true; }
    restG += (e.gamma - restG) * 0.004;
    restB += (e.beta - restB) * 0.004;
    goalX = clamp((e.gamma - restG) / 18);
    goalY = clamp((e.beta - restB) / 18);
  };
  const Motion = window.DeviceOrientationEvent;
  if (Motion && typeof Motion.requestPermission === 'function') {
    // iPhone only hands over motion data after a tap
    hint.hidden = false;
    stage.addEventListener('click', async () => {
      if (gyro) return;
      hint.hidden = true;
      try {
        if ((await Motion.requestPermission()) === 'granted') addEventListener('deviceorientation', onTilt);
      } catch (_) { /* declined: the sway carries on */ }
    });
  } else if (Motion) addEventListener('deviceorientation', onTilt);
})();

// Days left chip
(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = Math.round((VOTE_DAY - today) / 864e5);
  $('#days').textContent =
    d > 1 ? `${d} days to vote` : d === 1 ? 'Voting is tomorrow' : d === 0 ? 'Voting is today' : 'Thank you for voting';
})();

// Links
$('#waMain').href = wa('Hey Shabbir, here is my capstone: ');
$('#remind').href =
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text=' + encodeURIComponent('Vote Shabbir for VP of Capstone') +
  '&dates=20261015/20261016' +
  '&details=' + encodeURIComponent('Tetr Student Elections. Build it. Let\'s sell it. ' + SITE);

// Where is your capstone right now?
const ANSWERS = [
  {
    tag: 'You get: the Monthly Customer Sprint',
    text: 'Come to the first sprint without one. We’ll look for a problem people already pay to fix, and you build that.',
    msg: 'Hey Shabbir, I don’t have a capstone idea yet. Where do I start?',
  },
  {
    tag: 'You get: Build support',
    text: 'I’ll sit with you on the MVP, the website or the AI tools. We built Charlie AI in 48 hours, so I know where the time goes.',
    msg: 'Hey Shabbir, I’m building my capstone MVP and could use a hand. It’s:',
  },
  {
    tag: 'You get: the Monthly Customer Sprint',
    text: 'This is who the sprint is for. We fix your offer, write the pitch and send it to real customers the same day.',
    msg: 'Hey Shabbir, my capstone is built but has no customers yet. It is: ',
  },
  {
    tag: 'You get: Launch support',
    text: 'I’ll help you make content about it and get it a student venture spotlight. I helped grow TheRashidaDiaries to 80K+ followers, so this is the part I know best.',
    msg: 'Hey Shabbir, my capstone is selling and I want more customers. It is: ',
  },
];
const tabs = [...document.querySelectorAll('.picks button')];
const answer = $('#answer');
function pick(i, animate) {
  tabs.forEach((t, n) => t.setAttribute('aria-selected', n === i ? 'true' : 'false'));
  $('#ansTag').textContent = ANSWERS[i].tag;
  $('#ansText').textContent = ANSWERS[i].text;
  $('#ansLink').href = wa(ANSWERS[i].msg);
  if (animate && !calm) {
    answer.classList.remove('swap');
    void answer.offsetWidth;
    answer.classList.add('swap');
  }
}
tabs.forEach((t) => t.addEventListener('click', () => pick(+t.dataset.i, true)));
pick(2, false);

// Share
$('#share').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const data = { title: 'Vote Shabbir for VP of Capstone', text: 'Build it. Let\'s sell it. Vote Thursday, 15 October.', url: location.href };
  try {
    if (navigator.share) return await navigator.share(data);
    await navigator.clipboard.writeText(location.href);
    btn.textContent = 'Link copied';
    setTimeout(() => (btn.textContent = 'Share with your team'), 2200);
  } catch (_) { /* share sheet dismissed */ }
});

// Claim: words light up as you scroll through
(() => {
  const el = $('#claimText');
  const wrapWords = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) return frag.append(part);
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = part;
          frag.append(s);
        });
        n.replaceWith(frag);
      } else wrapWords(n);
    });
  };
  wrapWords(el);
  const words = [...el.querySelectorAll('.w')];
  if (calm) return words.forEach((w) => w.classList.add('on'));
  let queued = false;
  const paint = () => {
    queued = false;
    const r = el.getBoundingClientRect();
    const vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.86 - r.top) / (r.height + vh * 0.3)));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < lit));
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  paint();
})();

// Reveal on scroll, with a count-up for the proof numbers
const countUp = (el) => {
  const end = +el.dataset.count;
  if (calm || end < 3) return;
  const t0 = performance.now();
  const dur = 1100;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    en.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(en.target);
  });
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// Sticky bar: shows after the hero, steps aside at the final call to action
(() => {
  const bar = $('#bar');
  const hero = $('.hero');
  const test = $('#test');
  let pastHero = false, atTest = false;
  const sync = () => bar.classList.toggle('show', pastHero && !atTest);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; sync(); }, { threshold: 0.15 }).observe(hero);
  new IntersectionObserver(([e]) => { atTest = e.isIntersecting; sync(); }, { threshold: 0.2 }).observe(test);
})();
