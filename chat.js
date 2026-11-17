// Portfolio chat: a small AI assistant that answers from the portfolio's notes.
// It only appears when /api/chat/status says the chat is enabled.
(() => {
  'use strict';

  const EMAIL = 'stefandokman@hotmail.com';
  const STORE_KEY = 'portfolio-chat-v1';
  const MAX_CHARS = 1000;
  const SEND_TURNS = 20; // the server keeps fewer; this just bounds the request size
  const STARTERS = [
    'What does Stefan work on at Neuroblast?',
    'What shader and rendering work has Stefan done?',
    'How are the multiplayer web games built?',
    'How can I get in touch with Stefan?',
  ];
  const ERRORS = {
    budget: `The chat has used up its budget for now. You can still reach Stefan at ${EMAIL}.`,
    rate_limited: "You're sending messages a bit fast. Please wait a minute and try again.",
    busy: 'The AI service is busy right now. Please try again in a moment.',
    unavailable: `The chat isn't available right now. You can reach Stefan at ${EMAIL}.`,
    refusal: "Sorry, I can't help with that. Try asking about Stefan's projects or experience.",
    bad_request: 'That message could not be sent. Please try again, or start a new chat.',
    network: "Couldn't reach the chat. Check your connection and try again.",
    upstream: 'Something went wrong on our side. Please try again in a moment.',
  };

  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
  const ICONS = {
    chat: svg('M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z'),
    close: svg('M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'),
    reset: svg('M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'),
    send: svg('M2.01 21 23 12 2.01 3 2 10l15 2-15 2z'),
    stop: svg('M6 6h12v12H6z'),
  };

  // ---------- storage (per tab; the page works the same without it) ----------
  function load() {
    try {
      const data = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(data) ? data.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string') : [];
    } catch {
      return [];
    }
  }
  function save() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(history));
    } catch {
      /* storage blocked or full */
    }
  }

  // ---------- text rendering: plain text, with URLs and emails made clickable ----------
  const LINK_RE = /https?:\/\/[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
  function renderText(el, text) {
    el.textContent = '';
    let last = 0;
    for (const m of text.matchAll(LINK_RE)) {
      let target = m[0];
      const trail = (target.match(/[.,;:!?)\]'"]+$/) || [''])[0];
      if (trail) target = target.slice(0, -trail.length);
      el.append(text.slice(last, m.index));
      const a = document.createElement('a');
      if (/^https?:\/\//.test(target)) {
        a.href = target;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      } else {
        a.href = `mailto:${target}`;
      }
      a.textContent = target;
      el.append(a, trail);
      last = m.index + m[0].length;
    }
    el.append(text.slice(last));
  }

  // ---------- UI ----------
  let history = load();
  let busy = false;
  let controller = null;
  let launcher, panel, log, input, sendBtn, sr;

  function build() {
    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'chat-launcher';
    launcher.setAttribute('aria-controls', 'chat-panel');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = `${ICONS.chat}<span>Ask AI about my work</span>`;

    panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.id = 'chat-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'chat-title');
    panel.innerHTML = `
      <div class="chat-header">
        <div class="chat-title">
          <h2 id="chat-title">Ask about Stefan's work</h2>
          <p>AI assistant, answering from this portfolio</p>
        </div>
        <button type="button" class="chat-icon-btn chat-reset" aria-label="Start a new chat" title="New chat">${ICONS.reset}</button>
        <button type="button" class="chat-icon-btn chat-close" aria-label="Close chat" title="Close">${ICONS.close}</button>
      </div>
      <div class="chat-log" role="log" aria-live="off" aria-label="Conversation"></div>
      <div class="chat-sr" aria-live="polite"></div>
      <form class="chat-form">
        <textarea class="chat-input" rows="1" maxlength="${MAX_CHARS}" placeholder="Ask about projects, skills, experience…" aria-label="Your question"></textarea>
        <button type="submit" class="chat-send" aria-label="Send" disabled>${ICONS.send}</button>
      </form>
      <p class="chat-note">Answers are AI-generated from Stefan's portfolio notes and can be wrong. For anything important, email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>`;

    log = panel.querySelector('.chat-log');
    input = panel.querySelector('.chat-input');
    sendBtn = panel.querySelector('.chat-send');
    sr = panel.querySelector('.chat-sr');

    launcher.addEventListener('click', open);
    panel.querySelector('.chat-close').addEventListener('click', close);
    panel.querySelector('.chat-reset').addEventListener('click', reset);
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
    panel.querySelector('.chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (busy) stop();
      else submit();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        if (!busy) submit();
      }
    });
    input.addEventListener('input', () => {
      autosize();
      updateSend();
    });

    document.body.append(launcher, panel);
    renderAll();
  }

  function open() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('chat-locked');
    scrollToEnd(true);
    input.focus();
  }

  function close() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('chat-locked');
    launcher.focus();
  }

  function reset() {
    if (busy) stop();
    history = [];
    save();
    renderAll();
    input.value = '';
    autosize();
    updateSend();
    input.focus();
  }

  function autosize() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight + 2, 120)}px`;
  }

  function updateSend() {
    if (busy) {
      sendBtn.disabled = false;
      sendBtn.innerHTML = ICONS.stop;
      sendBtn.setAttribute('aria-label', 'Stop the answer');
    } else {
      sendBtn.disabled = !input.value.trim();
      sendBtn.innerHTML = ICONS.send;
      sendBtn.setAttribute('aria-label', 'Send');
    }
  }

  function nearBottom() {
    return log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  }
  function scrollToEnd(force) {
    if (force || nearBottom()) log.scrollTop = log.scrollHeight;
  }

  function renderAll() {
    log.textContent = '';
    if (history.length === 0) {
      const intro = document.createElement('div');
      intro.className = 'chat-intro';
      const p = document.createElement('p');
      p.textContent = "Hi! I'm an AI assistant. I can answer questions about Stefan's projects, skills and experience, using the notes on this portfolio. Try one of these:";
      const list = document.createElement('div');
      list.className = 'chat-starters';
      for (const q of STARTERS) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chat-starter';
        b.textContent = q;
        b.addEventListener('click', () => send(q));
        list.append(b);
      }
      intro.append(p, list);
      log.append(intro);
      return;
    }
    for (const m of history) {
      if (m.role === 'user') addMessage('user', m.text);
      else addSources(addMessage('bot', m.text).msg, m.sources);
    }
  }

  function addMessage(kind, text) {
    const msg = document.createElement('div');
    msg.className = `chat-msg chat-${kind}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    if (text != null) renderText(bubble, text);
    msg.append(bubble);
    log.append(msg);
    return { msg, bubble };
  }

  function addSources(msg, sources) {
    if (!Array.isArray(sources) || sources.length === 0) return;
    const wrap = document.createElement('div');
    wrap.className = 'chat-sources';
    wrap.append('Sources:');
    for (const s of sources) {
      if (!s || typeof s.label !== 'string') continue;
      let node;
      if (typeof s.link === 'string' && /^#[\w-]+$/.test(s.link)) {
        node = document.createElement('a');
        node.href = s.link;
        node.addEventListener('click', showSection);
      } else if (typeof s.link === 'string' && /^https:\/\//.test(s.link)) {
        node = document.createElement('a');
        node.href = s.link;
        node.target = '_blank';
        node.rel = 'noopener noreferrer';
      } else {
        node = document.createElement('span');
      }
      node.className = 'chat-source';
      node.textContent = s.label;
      wrap.append(node);
    }
    msg.append(wrap);
  }

  // A source like #neuroblast switches the page's tab (via the hash); bring the tabs into view.
  function showSection() {
    if (window.matchMedia('(max-width: 600px)').matches) close();
    setTimeout(() => {
      const tabs = document.querySelector('.page-tabs');
      if (tabs) tabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function showTyping(bubble) {
    bubble.innerHTML = '<span class="chat-typing" aria-label="Thinking"><span></span><span></span><span></span></span>';
  }

  function announce(text) {
    sr.textContent = '';
    setTimeout(() => {
      sr.textContent = text;
    }, 50);
  }

  function submit() {
    const text = input.value;
    if (!text.trim()) return;
    input.value = '';
    autosize();
    send(text);
  }

  function stop() {
    if (controller) controller.abort();
  }

  async function send(raw) {
    const text = raw.trim().slice(0, MAX_CHARS);
    if (!text || busy) return;
    if (history.length === 0) log.textContent = ''; // drop the intro

    const userMsg = addMessage('user', text);
    const bot = addMessage('bot', null);
    showTyping(bot.bubble);
    scrollToEnd(true);

    busy = true;
    controller = new AbortController();
    updateSend();

    const payload = history
      .map(({ role, text: t }) => ({ role, text: t }))
      .concat({ role: 'user', text })
      .slice(-SEND_TURNS);

    let answer = '';
    let sources = null;
    let error = null;
    let stopped = false;
    let frame = 0;
    const paint = () => {
      frame = 0;
      renderText(bot.bubble, answer);
      scrollToEnd(false);
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        let code = res.status === 429 ? 'rate_limited' : 'upstream';
        try {
          code = (await res.json()).error || code;
        } catch {
          /* not JSON */
        }
        throw Object.assign(new Error(code), { code });
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let cut;
        while ((cut = buffer.indexOf('\n\n')) !== -1) {
          const line = buffer.slice(0, cut);
          buffer = buffer.slice(cut + 2);
          if (!line.startsWith('data: ')) continue;
          let event;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (event.type === 'text' && typeof event.text === 'string') {
            answer += event.text;
            if (!frame) frame = requestAnimationFrame(paint);
          } else if (event.type === 'done') {
            sources = Array.isArray(event.sources) ? event.sources : [];
          } else if (event.type === 'error') {
            error = typeof event.error === 'string' ? event.error : 'upstream';
          }
        }
      }
      if (!error && sources === null && !answer) error = 'upstream';
    } catch (e) {
      if (e && e.name === 'AbortError') stopped = true;
      else error = (e && e.code) || 'network';
    }

    if (frame) cancelAnimationFrame(frame);
    busy = false;
    controller = null;
    answer = answer.trim();

    if (stopped && !answer) {
      // Stopped before anything arrived: undo the question and give it back.
      userMsg.msg.remove();
      bot.msg.remove();
      if (!input.value) {
        input.value = text;
        autosize();
      }
      if (history.length === 0) renderAll();
    } else if (answer) {
      if (stopped || error || sources === null) answer += ' …';
      renderText(bot.bubble, answer);
      addSources(bot.msg, sources);
      history.push({ role: 'user', text }, { role: 'assistant', text: answer, sources: sources || [] });
      save();
      announce(answer);
      if (error) {
        const note = addMessage('bot', ERRORS[error] || ERRORS.upstream);
        note.bubble.classList.add('chat-error');
      }
    } else {
      // Failed without an answer. The question stays on screen but isn't sent again later.
      bot.bubble.classList.add('chat-error');
      renderText(bot.bubble, ERRORS[error] || ERRORS.upstream);
      announce(ERRORS[error] || ERRORS.upstream);
    }
    updateSend();
    scrollToEnd(false);
    if (!panel.hidden) input.focus();
  }

  // ---------- start: only when the chat is switched on ----------
  function start() {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'chat.css';
    css.addEventListener('load', build, { once: true });
    document.head.append(css);
  }

  fetch('/api/chat/status', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((s) => {
      if (s && s.enabled) start();
    })
    .catch(() => {});
})();
