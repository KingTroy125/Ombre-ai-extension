var e=`Ombre AI was updated. Please refresh this page to keep chatting.`;function t(){try{return!!chrome.runtime?.id}catch{return!1}}function n(n){if(!t())return Promise.reject(Error(e));try{return chrome.runtime.sendMessage(n)}catch{return Promise.reject(Error(e))}}function r(e){if(!t())return Promise.resolve({});try{return chrome.storage.local.get(e)}catch{return Promise.resolve({})}}function i(e){if(t())try{chrome.storage.local.set(e).catch(()=>{})}catch{}}var a=[],o=!1;function s(){o||(o=!0,a.forEach(e=>{try{e()}catch{}}))}window.setInterval(()=>{t()||s()},2e4);var c=null,l=`ombre-ai-context-panel-host`;function u(){let e=document.getElementById(l);if(e&&e.shadowRoot)return{host:e,root:e.shadowRoot};e=document.createElement(`div`),e.id=l,e.style.position=`fixed`,e.style.zIndex=`2147483647`,e.style.bottom=`20px`,e.style.right=`20px`,document.documentElement.appendChild(e);let t=e.attachShadow({mode:`open`});return{host:e,root:t}}function d({query:e,response:t,error:n}){let{root:r}=u();r.innerHTML=``;let i=document.createElement(`style`);i.textContent=`
    .panel {
      width: 340px;
      max-height: 420px;
      display: flex;
      flex-direction: column;
      background: #111111;
      color: #f2f2f5;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.45);
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      overflow: hidden;
      animation: slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .brand { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
    .dot { width: 20px; height: 20px; border-radius: 6px; background: #6c63ff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; }
    .close { cursor: pointer; background: none; border: none; color: #8b8b95; line-height: 1; padding: 4px; border-radius: 6px; display: flex; }
    .close svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .close:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .body { padding: 12px; overflow-y: auto; font-size: 13px; line-height: 1.6; }
    .query { color: #8b8b95; font-size: 11.5px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .answer { line-height: 1.6; }
    .answer p { margin: 0 0 8px; }
    .answer p:last-child { margin-bottom: 0; }
    .answer .md-gap { height: 4px; }
    .answer ul, .answer ol { margin: 4px 0 10px; padding-left: 20px; }
    .answer li { margin-bottom: 4px; }
    .answer strong { font-weight: 600; color: #fff; }
    .answer code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-size: 12px; color: #c9c4ff; }
    .error { color: #ff8a8f; }
  `;let a=document.createElement(`div`);a.className=`panel`,a.innerHTML=`
    <div class="header">
      <div class="brand"><span class="dot">O</span> Ombre AI</div>
      <button class="close" aria-label="Close">
        <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="body">
      ${e?`<div class="query">${f(e)}</div>`:``}
      <div class="${n?`answer error`:`answer`}">${n?f(n):p(t||``)}</div>
    </div>
  `,a.querySelector(`.close`)?.addEventListener(`click`,()=>{document.getElementById(l)?.remove()}),r.appendChild(i),r.appendChild(a)}function f(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function p(e){let t=f(e).replace(/\r\n/g,`
`).split(`
`),n=``,r=null,i=()=>{r&&=(n+=r===`ul`?`</ul>`:`</ol>`,null)};for(let e of t){let t=e.trim(),a=/^[-*•]\s+(.*)$/.exec(t),o=/^\d+[.)]\s+(.*)$/.exec(t);a?(r!==`ul`&&(i(),n+=`<ul>`,r=`ul`),n+=`<li>${m(a[1])}</li>`):o?(r!==`ol`&&(i(),n+=`<ol>`,r=`ol`),n+=`<li>${m(o[1])}</li>`):(i(),t===``?n+=`<div class="md-gap"></div>`:n+=`<p>${m(t)}</p>`)}return i(),n}function m(e){return e.replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`).replace(/__(.+?)__/g,`<strong>$1</strong>`).replace(/`([^`]+?)`/g,`<code>$1</code>`).replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g,`<em>$1</em>`).replace(/(?<!_)_([^_\n]+?)_(?!_)/g,`<em>$1</em>`)}function h(e){return e.replace(/\r\n/g,`
`).replace(/```[\s\S]*?```/g,e=>e.replace(/```/g,``).trim()).replace(/\*\*(.+?)\*\*/g,`$1`).replace(/__(.+?)__/g,`$1`).replace(/`([^`]+?)`/g,`$1`).replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g,`$1`).replace(/(?<!_)_([^_\n]+?)_(?!_)/g,`$1`).replace(/^[ \t]*[-*•][ \t]+/gm,`• `).trim()}async function g(e){try{return await navigator.clipboard.writeText(e),!0}catch{try{let t=document.createElement(`textarea`);t.value=e,t.style.position=`fixed`,t.style.top=`-1000px`,t.style.opacity=`0`,document.body.appendChild(t),t.focus(),t.select();let n=document.execCommand(`copy`);return t.remove(),n}catch{return!1}}}var _=`
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="thinking-grad" gradientUnits="userSpaceOnUse" x1="5" y1="4" x2="20" y2="20">
        <stop offset="0" stop-color="currentColor" stop-opacity="1" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0.4" />
      </linearGradient>
    </defs>
    <path class="thinking-glyph-main" d="M 12 3 C 12.9 7.4 16.6 11.1 21 12 C 16.6 12.9 12.9 16.6 12 21 C 11.1 16.6 7.4 12.9 3 12 C 7.4 11.1 11.1 7.4 12 3 Z" fill="url(#thinking-grad)" />
    <path class="thinking-glyph-twinkle" d="M 19 2.5 C 19.18 4.32 19.68 4.82 21.5 5 C 19.68 5.18 19.18 5.68 19 7.5 C 18.82 5.68 18.32 5.18 16.5 5 C 18.32 4.82 18.82 4.32 19 2.5 Z" fill="currentColor" />
  </svg>
`;function v(e){let t=e[0]??``;return`
    ${_}
    <span class="thinking-word-grid">
      <span class="invisible-word">${f(e.reduce((e,t)=>e.length>=t.length?e:t,``))}</span>
      <span class="thinking-word" data-thinking-word>${f(t)}</span>
    </span>
  `}function y(e,t){let n=e.querySelector(`[data-thinking-word]`);if(!n)return;let r=n.cloneNode(!1);r.textContent=t,n.replaceWith(r)}function b(e,t,n=2600){if(t.length<=1)return()=>{};let r=0,i=window.setInterval(()=>{r=(r+1)%t.length;let n=e.querySelector(`[data-thinking-word]`);if(!n)return;let i=n.cloneNode(!1);i.textContent=t[r],n.replaceWith(i)},n);return()=>window.clearInterval(i)}chrome.runtime.onMessage.addListener(e=>{if(e.type===`TOQAN_CONTEXT_RESPONSE`){let t=e;d({type:t.type,query:t.query,response:t.response})}else if(e.type===`TOQAN_CONTEXT_ERROR`){let t=e;d({type:t.type,error:t.error})}else e.type===`OMBRE_ADD_TO_CHAT`&&`text`in e&&e.text&&c?.(e.text)});var x=`ombre-ai-edge-panel-host`,S=`toqan_edge_conversations`;function C(){return`edge-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}function w(e){let t=e.trim().replace(/\s+/g,` `);return t.length>42?`${t.slice(0,42)}…`:t||`New chat`}function T(e){let t=Date.now()-e,n=Math.floor(t/6e4);if(n<1)return`Just now`;if(n<60)return`${n}m ago`;let r=Math.floor(n/60);if(r<24)return`${r}h ago`;let i=Math.floor(r/24);return i<7?`${i}d ago`:new Date(e).toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function E(){if(window.self!==window.top||document.getElementById(x))return;let t=document.createElement(`div`);t.id=x,document.documentElement.appendChild(t);let o=t.attachShadow({mode:`open`}),s=document.createElement(`style`);s.textContent=`
    :host { all: initial; }
    * { box-sizing: border-box; font-family: "Inter", system-ui, -apple-system, sans-serif; }

    .pill {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translate(34px, -50%);
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      padding: 14px 9px;
      background: #17171a;
      border-radius: 26px 0 0 26px;
      box-shadow: -3px 0 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06);
      cursor: default;
      transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    .pill:hover, .pill.pinned { transform: translate(0, -50%); }

    .pill-open {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      background: #ffffff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .pill-open:hover { transform: scale(1.06); }
    .pill-open svg { width: 15px; height: 15px; fill: #111111; stroke: none; }

    .pill-settings {
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: #f2f2f5;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #6b6b76;
      margin-top: 10px;
      transform: translate(6px, 2px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      transition: background 0.15s, color 0.15s;
    }
    .pill-settings:hover { background: #ffffff; color: #18181b; }
    .pill-settings svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2.25; stroke-linecap: round; stroke-linejoin: round; }

    .panel {
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      width: 380px;
      max-width: 92vw;
      background: #111111;
      color: #f2f2f5;
      border-left: 1px solid rgba(255,255,255,0.08);
      box-shadow: -12px 0 40px rgba(0,0,0,0.45);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.32s cubic-bezier(0.16,1,0.3,1);
    }
    .panel.open { transform: translateX(0); }

    .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .brand { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
    .brand .dot { width: 22px; height: 22px; border-radius: 7px; background: #6c63ff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
    .headerbtns { display: flex; align-items: center; gap: 2px; }
    .iconbtn { cursor: pointer; background: none; border: none; color: #8b8b95; padding: 6px; border-radius: 8px; display: flex; }
    .iconbtn:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .iconbtn.active { background: rgba(108,99,255,0.15); color: #a9a3ff; }
    .iconbtn svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }

    .body-wrap { position: relative; flex: 1; min-height: 0; display: flex; }
    .body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; }

    .jump-btn {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(255,255,255,0.1);
      background: #1c1c20;
      color: #f2f2f5;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      padding: 7px 12px;
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(0,0,0,0.35);
      transition: transform 0.15s;
    }
    .jump-btn:hover { transform: translateX(-50%) translateY(-1px); }
    .jump-btn svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .empty { margin: auto; text-align: center; color: #8b8b95; font-size: 13px; padding: 0 20px; }
    .empty .title { color: #f2f2f5; font-size: 15px; font-weight: 600; margin-bottom: 6px; }

    .row { display: flex; gap: 8px; }
    .row.user { flex-direction: row-reverse; }
    .avatar { width: 24px; height: 24px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .avatar.assistant { background: #6c63ff; }
    .avatar.user { background: #1e1e22; }
    .avatar svg { width: 12px; height: 12px; stroke: #fff; fill: none; stroke-width: 2; }
    .bubble { max-width: 78%; padding: 9px 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.55; white-space: pre-wrap; }
    .bubble.assistant { background: #17171a; border-top-left-radius: 4px; white-space: normal; }
    .bubble.user { background: #6c63ff; color: #fff; border-top-right-radius: 4px; }
    .bubble.error { background: rgba(242,85,90,0.1); border: 1px solid rgba(242,85,90,0.4); color: #ff8a8f; white-space: pre-wrap; }
    .bubble p { margin: 0 0 6px; }
    .bubble p:last-child { margin-bottom: 0; }
    .bubble .md-gap { height: 2px; }
    .bubble ul, .bubble ol { margin: 2px 0 8px; padding-left: 18px; }
    .bubble li { margin-bottom: 3px; }
    .bubble strong { font-weight: 600; color: #fff; }
    .bubble code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 4px; font-size: 12px; color: #c9c4ff; }

    .thinking { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #17171a; border-radius: 14px; border-top-left-radius: 4px; width: fit-content; color: #8b8b95; }

    .thinking-glyph-main {
      animation: thinking-morph 4s ease-in-out infinite, thinking-spin-scale 4s ease-in-out infinite;
      transform-box: view-box;
      transform-origin: center;
    }
    .thinking-glyph-twinkle {
      animation: thinking-twinkle 4s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes thinking-morph {
      0%, 100% { d: path("M 12 3 C 12.9 7.4 16.6 11.1 21 12 C 16.6 12.9 12.9 16.6 12 21 C 11.1 16.6 7.4 12.9 3 12 C 7.4 11.1 11.1 7.4 12 3 Z"); }
      30%  { d: path("M 12 4.2 C 16.8 3.4 20.6 7.2 19.8 12 C 20.6 16.4 16.4 20.6 12 19.8 C 7.8 20.6 3.4 16.8 4.2 12 C 3.4 7.6 7.2 3.4 12 4.2 Z"); }
      50%  { d: path("M 12 5 C 15.87 5 19 8.13 19 12 C 19 15.87 15.87 19 12 19 C 8.13 19 5 15.87 5 12 C 5 8.13 8.13 5 12 5 Z"); }
      70%  { d: path("M 12 3.6 C 16.4 4.6 18.6 8 19.2 12 C 18.6 16.2 16.2 19.4 12 20.4 C 8 19.4 5.2 16.4 4.8 12 C 5.4 7.8 7.6 4.4 12 3.6 Z"); }
    }
    @keyframes thinking-spin-scale {
      0%, 100% { transform: rotate(0deg) scale(1); }
      30% { transform: rotate(108deg) scale(0.9); }
      50% { transform: rotate(180deg) scale(0.78); }
      70% { transform: rotate(252deg) scale(0.9); }
    }
    @keyframes thinking-twinkle {
      0%, 100% { opacity: 0; transform: rotate(0deg) scale(0.2); }
      30% { opacity: 0; transform: rotate(45deg) scale(0.5); }
      50% { opacity: 1; transform: rotate(90deg) scale(1); }
      70% { opacity: 0; transform: rotate(135deg) scale(0.5); }
    }
    .thinking-word-grid { display: inline-grid; overflow: hidden; font-size: 12.5px; }
    .thinking-word-grid > * { grid-column: 1; grid-row: 1; }
    .invisible-word { visibility: hidden; }
    .thinking-word {
      animation: thinking-word-in 0.32s cubic-bezier(0.4, 0, 0.2, 1), thinking-sheen 2s linear infinite;
      background-image: linear-gradient(90deg, transparent calc(50% - 16px), #f2f2f5, transparent calc(50% + 16px)), linear-gradient(#8b8b95, #8b8b95);
      background-repeat: no-repeat, padding-box;
      background-size: 250% 100%, auto;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }
    @keyframes thinking-word-in {
      from { opacity: 0; transform: translateY(70%); filter: blur(3px); background-position: 100% center, 0 0; }
      to   { opacity: 1; transform: translateY(0); filter: blur(0); background-position: 0% center, 0 0; }
    }
    @keyframes thinking-sheen {
      from { background-position: 0% center, 0 0; }
      to   { background-position: -200% center, 0 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .thinking-glyph-main, .thinking-glyph-twinkle, .thinking-word { animation: none !important; }
    }

    .history-list { display: flex; flex-direction: column; gap: 3px; }
    .history-empty { margin: auto; text-align: center; color: #8b8b95; font-size: 13px; padding: 0 20px; }
    .history-item { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 9px 10px; border-radius: 10px; cursor: pointer; }
    .history-item:hover { background: #1c1c20; }
    .history-item.active { background: #1c1c20; }
    .history-item-main { min-width: 0; flex: 1; }
    .history-item-title { font-size: 13px; color: #f2f2f5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .history-item-time { font-size: 11px; color: #8b8b95; margin-top: 1px; }
    .history-item-del { flex-shrink: 0; padding: 5px; border-radius: 7px; color: #6b6b76; background: none; border: none; cursor: pointer; opacity: 0; }
    .history-item:hover .history-item-del { opacity: 1; }
    .history-item-del:hover { background: rgba(242,85,90,0.15); color: #ff8a8f; }
    .history-item-del svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }

    .reload-banner { display: flex; align-items: center; gap: 7px; padding: 8px 12px; background: rgba(242,85,90,0.1); border-top: 1px solid rgba(242,85,90,0.25); color: #ff9da1; font-size: 11.5px; line-height: 1.4; }
    .reload-banner svg { width: 15px; height: 15px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

    .inputrow { border-top: 1px solid rgba(255,255,255,0.08); padding: 10px; }
    .inputbox { display: flex; align-items: flex-end; gap: 8px; background: #17171a; border: 1px solid rgba(255,255,255,0.09); border-radius: 14px; padding: 6px 6px 6px 10px; }
    .inputbox:focus-within { border-color: rgba(108,99,255,0.6); box-shadow: 0 0 0 3px rgba(108,99,255,0.15); }
    textarea { flex: 1; resize: none; max-height: 120px; background: transparent; border: none; outline: none; color: #f2f2f5; font-size: 13.5px; line-height: 1.5; font-family: inherit; padding: 4px 0; }
    textarea::placeholder { color: #8b8b95; }
    .send { width: 30px; height: 30px; border-radius: 999px; background: #6c63ff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: transform 0.15s; }
    .send:hover { transform: scale(1.05); }
    .send:disabled { opacity: 0.3; cursor: default; transform: none; }
    .send svg { width: 15px; height: 15px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    .mic { width: 30px; height: 30px; border-radius: 999px; background: #26262b; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; color: #c8c8ce; transition: transform 0.15s, background 0.15s, color 0.15s; }
    .mic:hover { transform: scale(1.05); color: #fff; }
    .mic.listening { background: #f2555a; color: #fff; animation: mic-pulse 1.4s ease-in-out infinite; }
    .mic svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    @keyframes mic-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(242,85,90,0.45); } 50% { box-shadow: 0 0 0 6px rgba(242,85,90,0); } }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
  `;let l=document.createElement(`div`);l.className=`pill`,l.innerHTML=`
    <button class="pill-open" aria-label="Open Ombre AI chat" title="Open Ombre AI chat">
      <svg viewBox="0 0 24 24"><path d="M12 5.5 4 15h5v3.5h6V15h5L12 5.5z"/></svg>
    </button>
    <button class="pill-settings" aria-label="Settings" title="Settings">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  `;let u=document.createElement(`div`);u.className=`panel`,u.innerHTML=`
    <div class="header">
      <div class="brand"><span class="dot">O</span> Ombre AI</div>
      <div class="headerbtns">
        <button class="iconbtn history" aria-label="Chat history" title="Chat history">
          <svg viewBox="0 0 24 24"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
        </button>
        <button class="iconbtn newchat" aria-label="New chat" title="New chat">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button class="iconbtn close" aria-label="Close" title="Close">
          <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
    <div class="body-wrap">
      <div class="body"></div>
      <button class="jump-btn" style="display:none;">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        <span class="jump-btn-label">Jump to latest</span>
      </button>
    </div>
    <div class="reload-banner" style="display:none;">
      <svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
      <span>${e}</span>
    </div>
    <div class="inputrow">
      <div class="inputbox">
        <textarea rows="1" placeholder="Ask Ombre AI anything…"></textarea>
        <button class="mic" aria-label="Voice input" title="Voice input">
          <svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
        </button>
        <button class="send" aria-label="Send" title="Send">
          <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
        </button>
      </div>
    </div>
  `,o.append(s,l,u);let d=u.querySelector(`.body`);d.setAttribute(`role`,`log`),d.setAttribute(`aria-relevant`,`additions`);let m=u.querySelector(`.jump-btn`),h=u.querySelector(`.jump-btn-label`),g=u.querySelector(`textarea`),_=u.querySelector(`.send`),E=u.querySelector(`.mic`),D=u.querySelector(`.close`),O=u.querySelector(`.history`),k=u.querySelector(`.newchat`),A=[],j=null,M=!1,N=!1,P=!1,F=null,I=null,L=!0;function R(){return d.scrollHeight-d.scrollTop-d.clientHeight<56}function z(e){L=e,m.style.display=e?`none`:`flex`,e&&(h.textContent=`Jump to latest`)}function B(e=`smooth`){d.scrollTo({top:d.scrollHeight,behavior:e}),z(!0)}d.addEventListener(`scroll`,()=>{let e=R();e!==L&&z(e)}),m.addEventListener(`click`,()=>B());function V(){return A.find(e=>e.id===j)??null}r([S]).then(e=>{A=e[S]||[],j=A[0]?.id??null,K()});function H(){A.sort((e,t)=>t.updatedAt-e.updatedAt);let e=A.slice(0,30).map(e=>({...e,messages:e.messages.slice(-200)}));i({[S]:e})}function U(){let e=V();if(e&&e.messages.length===0){N=!1,K();return}let t={id:C(),title:`New chat`,createdAt:Date.now(),updatedAt:Date.now(),messages:[]};A.unshift(t),j=t.id,N=!1,H(),K()}function W(){let e=V();if(e)return e;let t={id:C(),title:`New chat`,createdAt:Date.now(),updatedAt:Date.now(),messages:[]};return A.unshift(t),j=t.id,t}function G(e){j=e,N=!1,M=!1,K()}function ee(e){A=A.filter(t=>t.id!==e),j===e&&(j=A[0]?.id??null),H(),K()}function K(){N?(O.classList.add(`active`),te()):(O.classList.remove(`active`),re())}function te(){if(A.length===0){d.innerHTML=`<div class="history-empty">No past chats yet. Start one and it'll show up here.</div>`;return}d.innerHTML=`<div class="history-list">${A.map(e=>`
      <div class="history-item${e.id===j?` active`:``}" data-id="${e.id}">
        <div class="history-item-main">
          <div class="history-item-title">${f(e.title)}</div>
          <div class="history-item-time">${T(e.updatedAt)} · ${e.messages.length} message${e.messages.length===1?``:`s`}</div>
        </div>
        <button class="history-item-del" data-id="${e.id}" aria-label="Delete chat" title="Delete chat">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </div>`).join(``)}</div>`,d.querySelectorAll(`.history-item`).forEach(e=>{e.addEventListener(`click`,()=>G(e.dataset.id))}),d.querySelectorAll(`.history-item-del`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),ee(e.dataset.id)})})}let q=null,J=0,Y=null;function ne(e){let t=d.querySelector(`[data-msg-id="${e}"]`);if(!t)return;let n=t.getBoundingClientRect().top-d.getBoundingClientRect().top-12;d.scrollTo({top:d.scrollTop+n,behavior:`smooth`})}function re(){let e=V(),t=e?.messages??[],n=e?.id??null;d.setAttribute(`aria-busy`,String(M));let r=L,i=d.scrollTop,a=n!==q,o=t[t.length-1],s=!!o&&o.id!==Y&&!a&&o.role===`user`,c=!a&&t.length>J;if(t.length===0&&!M){d.innerHTML=`<div class="empty"><div class="title">Ombre AI</div>Ask a question about this page, or anything else — right from here.</div>`,q=n,J=0,Y=null,z(!0);return}d.innerHTML=t.map(e=>`
      <div class="row ${e.role}" data-msg-id="${e.id}">
        <div class="avatar ${e.role}">
          ${e.role===`user`?`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`:`<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>`}
        </div>
        <div class="bubble ${e.role}${e.error?` error`:``}">${e.role===`assistant`&&!e.error?p(e.content):f(e.content)}</div>
      </div>`).join(``),M?(d.innerHTML+=`<div class="row assistant"><div class="avatar assistant"><svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg></div><div class="thinking">${v([`Thinking`,`Reasoning`,`Considering`])}</div></div>`,I?.(),I=b(d,[`Thinking`,`Reasoning`,`Considering`])):(I?.(),I=null),q=n,J=t.length,Y=o?.id??null,s?(requestAnimationFrame(()=>ne(o.id)),z(!1)):a?B(`auto`):r?B(`smooth`):(d.scrollTop=i,c&&(h.textContent=`New message`,m.style.display=`flex`))}function X(){g.style.height=`auto`,g.style.height=`${Math.min(g.scrollHeight,120)}px`}function Z(){let e=g.value.trim();if(!e||M)return;P&&F?.();let t=W(),r=t.messages.length===0;t.messages.push({id:C(),role:`user`,content:e}),t.updatedAt=Date.now(),r&&(t.title=w(e)),H(),N=!1,g.value=``,X(),M=!0,K();let i=t.id;n({type:`TOQAN_CHAT`,messages:t.messages.map(e=>({id:e.id,role:e.role,content:e.content,createdAt:Date.now()})),conversationId:i}).catch(e=>{let t=A.find(e=>e.id===i);t&&(t.id===j&&(M=!1),t.messages.push({id:C(),role:`assistant`,content:e.message,error:!0}),t.updatedAt=Date.now(),H(),K())})}chrome.runtime.onMessage.addListener(e=>{if(!(`conversationId`in e)||!e.conversationId)return;let t=A.find(t=>t.id===e.conversationId);t&&(e.type===`TOQAN_REPLY`?(t.id===j&&(M=!1),t.messages.push({id:C(),role:`assistant`,content:e.reply??``}),t.updatedAt=Date.now(),H(),t.id===j&&!N&&K()):e.type===`TOQAN_ERROR`?(t.id===j&&(M=!1),t.messages.push({id:C(),role:`assistant`,content:e.error??`Unknown error`,error:!0}),t.updatedAt=Date.now(),H(),t.id===j&&!N&&K()):e.type===`TOQAN_OVERLOADED`&&t.id===j&&!N&&(I?.(),I=null,y(d,`Retrying`)))}),g.addEventListener(`input`,X),g.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),Z())}),_.addEventListener(`click`,Z);let Q=window,$=Q.SpeechRecognition||Q.webkitSpeechRecognition;if(!$)E.style.display=`none`;else{let e=new $;e.continuous=!0,e.interimResults=!0,e.lang=navigator.language||`en-US`;let t=``;e.onresult=e=>{let n=``,r=``;for(let t=e.resultIndex;t<e.results.length;t++){let i=e.results[t];i.isFinal?r+=i[0].transcript:n+=i[0].transcript}let i=(r||n).trim();i&&(g.value=t?`${t} ${i}`:i,r&&(t=g.value),X())},e.onend=()=>{P=!1,E.classList.remove(`listening`)},e.onerror=()=>{P=!1,E.classList.remove(`listening`)},F=()=>{try{e.stop()}catch{}P=!1,E.classList.remove(`listening`),t=``},E.addEventListener(`click`,()=>{if(P)F?.();else{t=g.value;try{e.start(),P=!0,E.classList.add(`listening`)}catch{}}})}let ie=l.querySelector(`.pill-open`),ae=l.querySelector(`.pill-settings`);ie.addEventListener(`click`,()=>{u.classList.add(`open`),l.classList.add(`pinned`),setTimeout(()=>g.focus(),320)}),ae.addEventListener(`click`,()=>{n({type:`OPEN_SETTINGS`})}),k.addEventListener(`click`,U),O.addEventListener(`click`,()=>{N=!N,K()}),D.addEventListener(`click`,()=>{u.classList.remove(`open`),l.classList.remove(`pinned`)}),c=e=>{N&&(N=!1,K());let t=`"${e}"\n\n`;g.value=g.value.trim()?`${g.value}\n\n${t}`:t,X(),u.classList.add(`open`),l.classList.add(`pinned`),setTimeout(()=>{g.focus(),g.setSelectionRange(g.value.length,g.value.length)},320)};let oe=u.querySelector(`.reload-banner`);a.push(()=>{oe.style.display=`flex`,g.disabled=!0,g.placeholder=`Refresh this page to keep chatting…`,_.disabled=!0,E.style.display=`none`,k.disabled=!0,O.disabled=!0})}var D=`ombre-ai-selection-host`,O={ask:e=>e,improve:e=>`Improve the writing quality, clarity, and flow of the following text. Return ONLY the improved text with no preamble, quotes, or explanation:\n\n${e}`,rephrase:e=>`Rephrase the following text in a different way while keeping the same meaning. Return ONLY the rephrased text with no preamble, quotes, or explanation:\n\n${e}`,addmore:e=>`Expand on the following text with more relevant detail, keeping the same tone and style. Return ONLY the expanded text with no preamble, quotes, or explanation:\n\n${e}`};function k(){if(document.getElementById(D))return;let e=document.createElement(`div`);e.id=D,document.documentElement.appendChild(e);let t=e.attachShadow({mode:`open`}),r=document.createElement(`style`);r.textContent=`
    :host { all: initial; }
    * { box-sizing: border-box; font-family: "Inter", system-ui, -apple-system, sans-serif; }

    .toolbar {
      position: fixed;
      z-index: 2147483647;
      display: flex;
      align-items: stretch;
      padding: 4px;
      border-radius: 13px;
      background: #1c1c1f;
      box-shadow: 0 10px 28px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
      opacity: 0;
      transform: translateY(6px) scale(0.97);
      transition: opacity 0.16s ease, transform 0.16s ease;
      pointer-events: none;
    }
    .toolbar.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    .tbtn {
      display: flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: transparent;
      color: #e4e4e7;
      font-size: 12.5px;
      font-weight: 500;
      padding: 6px 10px 6px 6px;
      border-radius: 9px;
      cursor: pointer;
      white-space: nowrap;
      position: relative;
      transition: background 0.12s;
    }
    .tbtn:hover { background: rgba(255,255,255,0.08); }
    .tbtn + .tbtn::before {
      content: "";
      position: absolute;
      left: -2px;
      top: 20%;
      height: 60%;
      width: 1px;
      background: rgba(255,255,255,0.1);
    }
    .tbtn:hover + .tbtn::before, .tbtn:hover::before { background: transparent; }

    .ticon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .ticon.c-ask { background: linear-gradient(135deg, #6c63ff, #8b5cf6); }
    .ticon.c-improve { background: #f5a524; }
    .ticon.c-rephrase { background: #3b82f6; }
    .ticon.c-addmore { background: #22c55e; }
    .ticon.c-chat { background: #ec4899; }
    .ticon svg { width: 11px; height: 11px; stroke: #fff; fill: none; stroke-width: 2.25; stroke-linecap: round; stroke-linejoin: round; }

    .card {
      position: fixed;
      z-index: 2147483647;
      width: 320px;
      max-height: 340px;
      display: flex;
      flex-direction: column;
      background: #111111;
      color: #f2f2f5;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.45);
      opacity: 0;
      transform: translateY(6px) scale(0.98);
      transition: opacity 0.18s ease, transform 0.18s ease;
      pointer-events: none;
      overflow: hidden;
    }
    .card.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    .card-header { display: flex; align-items: center; justify-content: space-between; padding: 9px 11px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
    .card-brand { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; }
    .card-dot { width: 18px; height: 18px; border-radius: 6px; background: #6c63ff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
    .card-close { cursor: pointer; background: none; border: none; color: #8b8b95; padding: 4px; border-radius: 6px; display: flex; }
    .card-close:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .card-close svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; }

    .card-body { flex: 1; overflow-y: auto; padding: 11px; font-size: 12.5px; line-height: 1.6; }
    .card-body p { margin: 0 0 7px; }
    .card-body p:last-child { margin-bottom: 0; }
    .card-body ul, .card-body ol { margin: 3px 0 8px; padding-left: 17px; }
    .card-body li { margin-bottom: 3px; }
    .card-body strong { font-weight: 600; color: #fff; }
    .card-body code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-size: 11.5px; color: #c9c4ff; }
    .card-body .error-text { color: #ff8a8f; }

    .addmore-preview { font-size: 12px; font-style: italic; color: #8b8b95; padding: 8px 9px; background: #17171a; border-radius: 8px; margin-bottom: 9px; max-height: 60px; overflow-y: auto; }
    .addmore-label { font-size: 11.5px; color: #8b8b95; margin: 0 0 6px; }
    .addmore-input { width: 100%; resize: none; background: #17171a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #f2f2f5; font-size: 12.5px; font-family: inherit; padding: 7px 9px; outline: none; margin-bottom: 8px; }
    .addmore-input:focus { border-color: rgba(108,99,255,0.6); box-shadow: 0 0 0 3px rgba(108,99,255,0.15); }
    .addmore-submit { display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; border: none; background: #6c63ff; color: #fff; font-size: 12.5px; font-weight: 600; padding: 7px 8px; border-radius: 8px; cursor: pointer; transition: background 0.12s; }
    .addmore-submit:hover { background: #7d75ff; }
    .addmore-submit svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    .card-loading { display: flex; align-items: center; gap: 8px; padding: 2px 0; color: #8b8b95; }

    .thinking-glyph-main {
      animation: thinking-morph 4s ease-in-out infinite, thinking-spin-scale 4s ease-in-out infinite;
      transform-box: view-box;
      transform-origin: center;
    }
    .thinking-glyph-twinkle {
      animation: thinking-twinkle 4s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes thinking-morph {
      0%, 100% { d: path("M 12 3 C 12.9 7.4 16.6 11.1 21 12 C 16.6 12.9 12.9 16.6 12 21 C 11.1 16.6 7.4 12.9 3 12 C 7.4 11.1 11.1 7.4 12 3 Z"); }
      30%  { d: path("M 12 4.2 C 16.8 3.4 20.6 7.2 19.8 12 C 20.6 16.4 16.4 20.6 12 19.8 C 7.8 20.6 3.4 16.8 4.2 12 C 3.4 7.6 7.2 3.4 12 4.2 Z"); }
      50%  { d: path("M 12 5 C 15.87 5 19 8.13 19 12 C 19 15.87 15.87 19 12 19 C 8.13 19 5 15.87 5 12 C 5 8.13 8.13 5 12 5 Z"); }
      70%  { d: path("M 12 3.6 C 16.4 4.6 18.6 8 19.2 12 C 18.6 16.2 16.2 19.4 12 20.4 C 8 19.4 5.2 16.4 4.8 12 C 5.4 7.8 7.6 4.4 12 3.6 Z"); }
    }
    @keyframes thinking-spin-scale {
      0%, 100% { transform: rotate(0deg) scale(1); }
      30% { transform: rotate(108deg) scale(0.9); }
      50% { transform: rotate(180deg) scale(0.78); }
      70% { transform: rotate(252deg) scale(0.9); }
    }
    @keyframes thinking-twinkle {
      0%, 100% { opacity: 0; transform: rotate(0deg) scale(0.2); }
      30% { opacity: 0; transform: rotate(45deg) scale(0.5); }
      50% { opacity: 1; transform: rotate(90deg) scale(1); }
      70% { opacity: 0; transform: rotate(135deg) scale(0.5); }
    }
    .thinking-word-grid { display: inline-grid; overflow: hidden; font-size: 12.5px; }
    .thinking-word-grid > * { grid-column: 1; grid-row: 1; }
    .invisible-word { visibility: hidden; }
    .thinking-word {
      animation: thinking-word-in 0.32s cubic-bezier(0.4, 0, 0.2, 1), thinking-sheen 2s linear infinite;
      background-image: linear-gradient(90deg, transparent calc(50% - 16px), #f2f2f5, transparent calc(50% + 16px)), linear-gradient(#8b8b95, #8b8b95);
      background-repeat: no-repeat, padding-box;
      background-size: 250% 100%, auto;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
    }
    @keyframes thinking-word-in {
      from { opacity: 0; transform: translateY(70%); filter: blur(3px); background-position: 100% center, 0 0; }
      to   { opacity: 1; transform: translateY(0); filter: blur(0); background-position: 0% center, 0 0; }
    }
    @keyframes thinking-sheen {
      from { background-position: 0% center, 0 0; }
      to   { background-position: -200% center, 0 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .thinking-glyph-main, .thinking-glyph-twinkle, .thinking-word { animation: none !important; }
    }

    .card-footer { display: flex; gap: 6px; padding: 9px 11px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
    .card-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; border: none; background: #1c1c20; color: #e6e6ea; font-size: 12px; font-weight: 500; padding: 7px 8px; border-radius: 8px; cursor: pointer; transition: background 0.12s; }
    .card-action:disabled { cursor: default; opacity: 0.85; }
    .card-action:hover { background: #26262b; }
    .card-action.primary { background: #6c63ff; color: #fff; }
    .card-action.primary:hover { background: #7d75ff; }
    .card-action svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }
  `;let i=document.createElement(`div`);i.className=`toolbar`,i.innerHTML=`
    <button class="tbtn" data-action="ask">
      <span class="ticon c-ask"><svg viewBox="0 0 24 24"><path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.5-6.5-2.1 2.1M8.6 15.4l-2.1 2.1m11-2.1 2.1 2.1M8.6 8.6 6.5 6.5"/></svg></span>
      Ask Ombre
    </button>
    <button class="tbtn" data-action="improve">
      Improve
    </button>
    <button class="tbtn" data-action="rephrase">
      Rephrase
    </button>
    <button class="tbtn" data-action="addmore">
      Add more
    </button>
    <button class="tbtn addchat" title="Send to chat panel to ask more there">
      Add to chat
    </button>
  `;let s=document.createElement(`div`);s.className=`card`,s.innerHTML=`
    <div class="card-header">
      <div class="card-brand"><span class="card-dot">O</span> Ombre AI</div>
      <button class="card-close" aria-label="Close" title="Close">
        <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="card-body"></div>
    <div class="card-footer" style="display:none;"></div>
  `,t.append(r,i,s);let l=s.querySelector(`.card-body`),u=s.querySelector(`.card-footer`),d=s.querySelector(`.card-close`),m=``,_=null,y=!1,x=null,S=0,C=0,w=null;function T(){i.classList.remove(`visible`)}function E(){s.classList.remove(`visible`),w=null,R?.()}function k(e){let t=e instanceof Element?e:e?.parentElement??null;for(;t;){if(t.id===`ombre-ai-edge-panel-host`||t.id===`ombre-ai-context-panel-host`||t.id===D)return!0;t=t.parentElement}return!1}function A(e){let t=e instanceof Element?e:e?.parentElement??null;for(;t;){if(t instanceof HTMLElement&&(t.isContentEditable||t.tagName===`TEXTAREA`||t.tagName===`INPUT`))return!0;t=t.parentElement}return!1}let j=new Set([`text`,`search`,`url`,`tel`,`email`,`password`,``]);function M(){let e=document.activeElement;if(k(e))return null;let t=e instanceof HTMLTextAreaElement,n=e instanceof HTMLInputElement&&j.has(e.type);if(!t&&!n)return null;let r=e,i=r.selectionStart,a=r.selectionEnd;return i==null||a==null||a<=i?null:{el:r,text:r.value.slice(i,a),start:i,end:a}}function N(e,t,n,r){let i=t.top-r-8,a=t.left+t.width/2-n/2;i<8&&(i=t.bottom+8),a<8&&(a=8),a+n>window.innerWidth-8&&(a=window.innerWidth-n-8),i+r>window.innerHeight-8&&(i=Math.max(8,window.innerHeight-r-8)),e.style.top=`${i}px`,e.style.left=`${a}px`}function P(e){if(e.width===0&&e.height===0){T();return}i.classList.add(`visible`),requestAnimationFrame(()=>{N(i,e,i.offsetWidth,i.offsetHeight)})}function F(){if(o||s.classList.contains(`visible`))return;let e=M();if(e){m=e.text.trim(),_=null,y=!0,x=e.el,S=e.start,C=e.end,P(e.el.getBoundingClientRect());return}let t=window.getSelection(),n=t?.toString().trim()??``;if(!n||!t||t.rangeCount===0){T();return}let r=t.getRangeAt(0);if(k(r.commonAncestorContainer)){T();return}m=n,_=r.cloneRange(),y=A(r.commonAncestorContainer),x=null,P(r.getBoundingClientRect())}let I;function L(){window.clearTimeout(I),I=window.setTimeout(F,120)}document.addEventListener(`selectionchange`,L),document.addEventListener(`mouseup`,L),document.addEventListener(`keyup`,e=>{(e.shiftKey||e.key===`Shift`)&&L()}),document.addEventListener(`mousedown`,e=>{k(e.target)||(T(),E())}),window.addEventListener(`scroll`,T,!0),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&(T(),E())}),d.addEventListener(`click`,E);let R=null;function z(e=[`Thinking`,`Reasoning`,`Considering`]){R?.(),l.innerHTML=`<div class="card-loading">${v(e)}</div>`,u.style.display=`none`,R=b(l,e)}function B(e,t){if(R?.(),l.innerHTML=t?`<div class="error-text">${f(e)}</div>`:p(e),t){u.style.display=`none`;return}u.style.display=`flex`,u.innerHTML=`
      <button class="card-action" data-act="copy">
        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        Copy
      </button>
      ${y?`<button class="card-action primary" data-act="replace">
              <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
              Replace
            </button>`:``}
    `,u.querySelector(`[data-act="copy"]`)?.addEventListener(`click`,async t=>{let n=t.currentTarget,r=n.innerHTML;n.innerHTML=await g(h(e))?`<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Copied`:`<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg> Couldn't copy`,n.disabled=!0,setTimeout(()=>{n.innerHTML=r,n.disabled=!1},1600)}),u.querySelector(`[data-act="replace"]`)?.addEventListener(`click`,()=>{let t=h(e);if(x)V(x,S,C,t);else if(_)try{let e=window.getSelection();e?.removeAllRanges(),e?.addRange(_),document.execCommand(`insertText`,!1,t)}catch{g(t)}E()})}function V(e,t,n,r){let i=e instanceof HTMLTextAreaElement?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype,a=Object.getOwnPropertyDescriptor(i,`value`)?.set,o=e.value.slice(0,t)+r+e.value.slice(n);a?a.call(e,o):e.value=o,e.dispatchEvent(new Event(`input`,{bubbles:!0}));let s=t+r.length;e.focus();try{e.setSelectionRange(s,s)}catch{}}function H(e){z();let t=`sel-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;w=t,n({type:`TOQAN_CHAT`,messages:[{id:`1`,role:`user`,content:e,createdAt:Date.now()}],conversationId:t}).catch(e=>{w===t&&B(e.message||`Something went wrong.`,!0)})}function U(){u.style.display=`none`;let e=m.length>140?`${m.slice(0,140)}…`:m;l.innerHTML=`
      <div class="addmore-preview">"${f(e)}"</div>
      <p class="addmore-label">What do you want to know more about? (optional — leave blank to just expand it)</p>
      <textarea class="addmore-input" rows="2" placeholder="e.g. its history, how it works, real-world examples…"></textarea>
      <button class="addmore-submit">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        Ask
      </button>
    `;let t=l.querySelector(`.addmore-input`),n=l.querySelector(`.addmore-submit`);t.focus();let r=()=>{let e=t.value.trim();H(e?`Here is a piece of text:\n\n"""${m}"""\n\nRegarding this text, the reader wants to know more about the following, so answer it clearly using the text as context: ${e}`:O.addmore(m))};n.addEventListener(`click`,r),t.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),r())})}function W(e){if(!m||o)return;let t=x?x.getBoundingClientRect():_?.getBoundingClientRect();if(T(),s.classList.add(`visible`),requestAnimationFrame(()=>{t&&N(s,t,320,e===`addmore`?210:200)}),e===`addmore`){U();return}H(O[e](m))}a.push(()=>{T(),E()}),chrome.runtime.onMessage.addListener(e=>{!e.conversationId||e.conversationId!==w||(e.type===`TOQAN_REPLY`?B(e.reply??``,!1):e.type===`TOQAN_ERROR`?B(e.error??`Unknown error`,!0):e.type===`TOQAN_OVERLOADED`&&z([`Retrying`]))}),i.querySelectorAll(`.tbtn[data-action]`).forEach(e=>{e.addEventListener(`click`,()=>W(e.dataset.action))}),i.querySelector(`.addchat`).addEventListener(`click`,()=>{o||!m||(T(),window.self===window.top&&c?c(m):n({type:`OMBRE_ADD_TO_CHAT`,text:m}).catch(()=>{}))})}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,()=>{E(),k()}):(E(),k());