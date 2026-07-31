(function(){var e=`Ombre AI was updated. Please refresh this page to keep chatting.`;function t(){try{return!!chrome.runtime?.id}catch{return!1}}function n(n){if(!t())return Promise.reject(Error(e));try{return chrome.runtime.sendMessage(n)}catch{return Promise.reject(Error(e))}}function r(e){if(!t())return Promise.resolve({});try{return chrome.storage.local.get(e)}catch{return Promise.resolve({})}}function i(e){if(t())try{chrome.storage.local.set(e).catch(()=>{})}catch{}}var a=[],o=!1;function s(){o||(o=!0,a.forEach(e=>{try{e()}catch{}}))}window.setInterval(()=>{t()||s()},2e4);var c=null,l=`data:image/png;base64,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`,u=`ombre-ai-context-panel-host`;function d(){let e=document.getElementById(u);if(e&&e.shadowRoot)return{host:e,root:e.shadowRoot};e=document.createElement(`div`),e.id=u,e.style.position=`fixed`,e.style.zIndex=`2147483647`,e.style.bottom=`20px`,e.style.right=`20px`,document.documentElement.appendChild(e);let t=e.attachShadow({mode:`open`});return{host:e,root:t}}function f({query:e,response:t,error:n}){let{root:r}=d();r.innerHTML=``;let i=document.createElement(`style`);i.textContent=`
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
      ${e?`<div class="query">${p(e)}</div>`:``}
      <div class="${n?`answer error`:`answer`}">${n?p(n):m(t||``)}</div>
    </div>
  `,a.querySelector(`.close`)?.addEventListener(`click`,()=>{document.getElementById(u)?.remove()}),r.appendChild(i),r.appendChild(a)}function p(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function m(e){let t=p(e).replace(/\r\n/g,`
`).split(`
`),n=``,r=null,i=()=>{r&&=(n+=r===`ul`?`</ul>`:`</ol>`,null)};for(let e of t){let t=e.trim(),a=/^[-*•]\s+(.*)$/.exec(t),o=/^\d+[.)]\s+(.*)$/.exec(t);a?(r!==`ul`&&(i(),n+=`<ul>`,r=`ul`),n+=`<li>${h(a[1])}</li>`):o?(r!==`ol`&&(i(),n+=`<ol>`,r=`ol`),n+=`<li>${h(o[1])}</li>`):(i(),n+=t===``?`<div class="md-gap"></div>`:`<p>${h(t)}</p>`)}return i(),n}function h(e){return e.replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`).replace(/__(.+?)__/g,`<strong>$1</strong>`).replace(/`([^`]+?)`/g,`<code>$1</code>`).replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g,`<em>$1</em>`).replace(/(?<!_)_([^_\n]+?)_(?!_)/g,`<em>$1</em>`)}function g(e){return e.replace(/\r\n/g,`
`).replace(/```[\s\S]*?```/g,e=>e.replace(/```/g,``).trim()).replace(/\*\*(.+?)\*\*/g,`$1`).replace(/__(.+?)__/g,`$1`).replace(/`([^`]+?)`/g,`$1`).replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g,`$1`).replace(/(?<!_)_([^_\n]+?)_(?!_)/g,`$1`).replace(/^[ \t]*[-*•][ \t]+/gm,`• `).trim()}async function _(e){try{return await navigator.clipboard.writeText(e),!0}catch{try{let t=document.createElement(`textarea`);t.value=e,t.style.position=`fixed`,t.style.top=`-1000px`,t.style.opacity=`0`,document.body.appendChild(t),t.focus(),t.select();let n=document.execCommand(`copy`);return t.remove(),n}catch{return!1}}}var v=`
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
`;function y(e){let t=e[0]??``;return`
    ${v}
    <span class="thinking-word-grid">
      <span class="invisible-word">${p(e.reduce((e,t)=>e.length>=t.length?e:t,``))}</span>
      <span class="thinking-word" data-thinking-word>${p(t)}</span>
    </span>
  `}function b(e,t){let n=e.querySelector(`[data-thinking-word]`);if(!n)return;let r=n.cloneNode(!1);r.textContent=t,n.replaceWith(r)}function x(e,t,n=2600){if(t.length<=1)return()=>{};let r=0,i=window.setInterval(()=>{r=(r+1)%t.length;let n=e.querySelector(`[data-thinking-word]`);if(!n)return;let i=n.cloneNode(!1);i.textContent=t[r],n.replaceWith(i)},n);return()=>window.clearInterval(i)}chrome.runtime.onMessage.addListener(e=>{if(e.type===`TOQAN_CONTEXT_RESPONSE`){let t=e;f({type:t.type,query:t.query,response:t.response})}else if(e.type===`TOQAN_CONTEXT_ERROR`){let t=e;f({type:t.type,error:t.error})}else e.type===`OMBRE_ADD_TO_CHAT`&&`text`in e&&e.text&&c?.(e.text)});var S=`ombre-ai-edge-panel-host`,C=`toqan_edge_conversations`;function w(){return`edge-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}function T(e){let t=e.trim().replace(/\s+/g,` `);return t.length>42?`${t.slice(0,42)}…`:t||`New chat`}function E(e){let t=Date.now()-e,n=Math.floor(t/6e4);if(n<1)return`Just now`;if(n<60)return`${n}m ago`;let r=Math.floor(n/60);if(r<24)return`${r}h ago`;let i=Math.floor(r/24);return i<7?`${i}d ago`:new Date(e).toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function D(){if(window.self!==window.top||document.getElementById(S))return;let t=document.createElement(`div`);t.id=S,document.documentElement.appendChild(t);let o=t.attachShadow({mode:`open`}),s=document.createElement(`style`);s.textContent=`
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
    .avatar { width: 24px; height: 24px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
    .avatar.assistant { background: #17171a; }
    .avatar.user { background: #1e1e22; }
    .avatar svg { width: 12px; height: 12px; stroke: #fff; fill: none; stroke-width: 2; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .col { display: flex; flex-direction: column; gap: 4px; max-width: 78%; }
    .row.assistant .col { align-items: flex-start; }
    .row.user .col { align-items: flex-end; }
    .bubble { padding: 9px 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.55; white-space: pre-wrap; }
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

    .msg-actions { display: flex; align-items: center; gap: 1px; padding-left: 2px; }
    .msg-copy, .msg-rate { width: 20px; height: 20px; border-radius: 5px; border: none; background: none; color: #75757e; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.12s, color 0.12s; }
    .msg-copy svg, .msg-rate svg { width: 11px; height: 11px; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
    .msg-copy:hover, .msg-rate:hover { background: rgba(255,255,255,0.08); color: #f2f2f5; }
    .msg-rate.active-up { color: #6c63ff; }
    .msg-rate.active-down { color: #ff8a8f; }

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
    .input-gradient-ring { border-radius: 15px; padding: 1.5px; background: linear-gradient(90deg, #6c63ff, #d946ef, #6c63ff); box-shadow: 0 1px 2px rgba(0,0,0,0.2); transition: box-shadow 0.15s; }
    .input-gradient-ring:focus-within { box-shadow: 0 0 0 3px rgba(108,99,255,0.18); }
    .input-tip { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 10px; background: linear-gradient(90deg, rgba(108,99,255,0.16), rgba(217,70,239,0.09), rgba(108,99,255,0.16)); border-radius: 13.5px 13.5px 0 0; }
    .input-tip span { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; color: #b7b2ff; }
    .input-tip svg.tip-star { width: 12px; height: 12px; fill: #b7b2ff; stroke: none; flex-shrink: 0; }
    .input-tip-close { background: none; border: none; padding: 2px; border-radius: 999px; color: #9a94e0; cursor: pointer; display: flex; }
    .input-tip-close svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .input-tip-close:hover { color: #d4d1ff; }
    .inputbox { display: flex; align-items: flex-end; gap: 8px; background: #17171a; border-radius: 13.5px; padding: 6px 6px 6px 10px; }
    .input-gradient-ring:has(.input-tip) .inputbox { border-radius: 0 0 13.5px 13.5px; }
    textarea { flex: 1; resize: none; max-height: 120px; background: transparent; border: none; outline: none; color: #f2f2f5; font-size: 13.5px; line-height: 1.5; font-family: inherit; padding: 4px 0; }
    textarea::placeholder { color: #8b8b95; }
    .send { width: 30px; height: 30px; border-radius: 999px; background: linear-gradient(135deg, #6c63ff, #d946ef); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: transform 0.15s; box-shadow: 0 2px 6px rgba(108,99,255,0.35); }
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
  `;let u=document.createElement(`div`);u.className=`pill`,u.innerHTML=`
    <button class="pill-open" aria-label="Open Ombre AI chat" title="Open Ombre AI chat">
      <svg viewBox="0 0 24 24"><path d="M12 5.5 4 15h5v3.5h6V15h5L12 5.5z"/></svg>
    </button>
    <button class="pill-settings" aria-label="Settings" title="Settings">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    </button>
  `;let d=document.createElement(`div`);d.className=`panel`,d.innerHTML=`
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
      <div class="input-gradient-ring">
        <div class="input-tip">
          <span>
            <svg class="tip-star" viewBox="0 0 24 24"><path d="M12 2.5c.4 2.7 1 4.4 2.3 5.7 1.3 1.3 3 1.9 5.7 2.3-2.7.4-4.4 1-5.7 2.3-1.3 1.3-1.9 3-2.3 5.7-.4-2.7-1-4.4-2.3-5.7-1.3-1.3-3-1.9-5.7-2.3 2.7-.4 4.4-1 5.7-2.3 1.3-1.3 1.9-3 2.3-5.7z"/></svg>
            Select text on any page to ask, improve, or rephrase it
          </span>
          <button class="input-tip-close" aria-label="Dismiss tip">
            <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
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
    </div>
  `,o.append(s,u,d);let f=d.querySelector(`.body`);f.setAttribute(`role`,`log`),f.setAttribute(`aria-relevant`,`additions`);let h=d.querySelector(`.jump-btn`),v=d.querySelector(`.jump-btn-label`),D=d.querySelector(`textarea`),O=d.querySelector(`.send`),k=d.querySelector(`.mic`),A=d.querySelector(`.close`),j=d.querySelector(`.history`),M=d.querySelector(`.newchat`),N=d.querySelector(`.input-tip`),P=d.querySelector(`.input-tip-close`),F=d.querySelector(`.inputbox`);P.addEventListener(`click`,()=>{N.remove(),F.style.borderRadius=`13.5px`});let I=[],L=null,R=!1,z=!1,B=!1,V=null,H=null,U=!0;function W(){return f.scrollHeight-f.scrollTop-f.clientHeight<56}function G(e){U=e,h.style.display=e?`none`:`flex`,e&&(v.textContent=`Jump to latest`)}function K(e=`smooth`){f.scrollTo({top:f.scrollHeight,behavior:e}),G(!0)}f.addEventListener(`scroll`,()=>{let e=W();e!==U&&G(e)}),h.addEventListener(`click`,()=>K());function q(){return I.find(e=>e.id===L)??null}r([C]).then(e=>{I=e[C]||[],L=I[0]?.id??null,Y()});function J(){I.sort((e,t)=>t.updatedAt-e.updatedAt);let e=I.slice(0,30).map(e=>({...e,messages:e.messages.slice(-200)}));i({[C]:e})}function ee(){let e=q();if(e&&e.messages.length===0){z=!1,Y();return}let t={id:w(),title:`New chat`,createdAt:Date.now(),updatedAt:Date.now(),messages:[]};I.unshift(t),L=t.id,z=!1,J(),Y()}function te(){let e=q();if(e)return e;let t={id:w(),title:`New chat`,createdAt:Date.now(),updatedAt:Date.now(),messages:[]};return I.unshift(t),L=t.id,t}function ne(e){L=e,z=!1,R=!1,Y()}function re(e){I=I.filter(t=>t.id!==e),L===e&&(L=I[0]?.id??null),J(),Y()}function Y(){z?(j.classList.add(`active`),ie()):(j.classList.remove(`active`),oe())}function ie(){if(I.length===0){f.innerHTML=`<div class="history-empty">No past chats yet. Start one and it'll show up here.</div>`;return}f.innerHTML=`<div class="history-list">${I.map(e=>`
      <div class="history-item${e.id===L?` active`:``}" data-id="${e.id}">
        <div class="history-item-main">
          <div class="history-item-title">${p(e.title)}</div>
          <div class="history-item-time">${E(e.updatedAt)} · ${e.messages.length} message${e.messages.length===1?``:`s`}</div>
        </div>
        <button class="history-item-del" data-id="${e.id}" aria-label="Delete chat" title="Delete chat">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </div>`).join(``)}</div>`,f.querySelectorAll(`.history-item`).forEach(e=>{e.addEventListener(`click`,()=>ne(e.dataset.id))}),f.querySelectorAll(`.history-item-del`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),re(e.dataset.id)})})}let X=null,Z=0,Q=null;function ae(e){let t=f.querySelector(`[data-msg-id="${e}"]`);if(!t)return;let n=t.getBoundingClientRect().top-f.getBoundingClientRect().top-12;f.scrollTo({top:f.scrollTop+n,behavior:`smooth`})}function oe(){let e=q(),t=e?.messages??[],n=e?.id??null;f.setAttribute(`aria-busy`,String(R));let r=U,i=f.scrollTop,a=n!==X,o=t[t.length-1],s=!!o&&o.id!==Q&&!a&&o.role===`user`,c=!a&&t.length>Z;if(t.length===0&&!R){f.innerHTML=`<div class="empty"><div class="title">Ombre AI</div>Ask a question about this page, or anything else — right from here.</div>`,X=n,Z=0,Q=null,G(!0);return}f.innerHTML=t.map(e=>`
      <div class="row ${e.role}" data-msg-id="${e.id}">
        <div class="avatar ${e.role}">
          ${e.role===`user`?`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`:`<img src="${l}" alt="Ombre AI" />`}
        </div>
        <div class="col">
          <div class="bubble ${e.role}${e.error?` error`:``}">${e.role===`assistant`&&!e.error?m(e.content):p(e.content)}</div>
          ${e.role===`assistant`&&!e.error?`<div class="msg-actions">
                  <button class="msg-copy" data-copy-id="${e.id}" title="Copy">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  <button class="msg-rate${e.rating===`up`?` active-up`:``}" data-rate-id="${e.id}" data-rate-value="up" title="Good response">
                    <svg viewBox="0 0 24 24" fill="${e.rating===`up`?`currentColor`:`none`}"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                  </button>
                  <button class="msg-rate${e.rating===`down`?` active-down`:``}" data-rate-id="${e.id}" data-rate-value="down" title="Bad response">
                    <svg viewBox="0 0 24 24" fill="${e.rating===`down`?`currentColor`:`none`}"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                  </button>
                </div>`:``}
        </div>
      </div>`).join(``),f.querySelectorAll(`[data-copy-id]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.copyId,n=q()?.messages.find(e=>e.id===t);n&&_(g(n.content)).then(t=>{if(!t)return;let n=e.innerHTML;e.innerHTML=`<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>`,setTimeout(()=>{e.innerHTML=n},1300)})})}),f.querySelectorAll(`[data-rate-id]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.rateId,n=e.dataset.rateValue,r=q(),i=r?.messages.find(e=>e.id===t);!r||!i||(i.rating=i.rating===n?void 0:n,J(),oe())})}),R?(f.innerHTML+=`<div class="row assistant"><div class="avatar assistant"><img src="${l}" alt="Ombre AI" /></div><div class="thinking">${y([`Thinking`,`Reasoning`,`Considering`])}</div></div>`,H?.(),H=x(f,[`Thinking`,`Reasoning`,`Considering`])):(H?.(),H=null),X=n,Z=t.length,Q=o?.id??null,s?(requestAnimationFrame(()=>ae(o.id)),G(!1)):a?K(`auto`):r?K(`smooth`):(f.scrollTop=i,c&&(v.textContent=`New message`,h.style.display=`flex`))}function $(){D.style.height=`auto`,D.style.height=`${Math.min(D.scrollHeight,120)}px`}function se(){let e=D.value.trim();if(!e||R)return;B&&V?.();let t=te(),r=t.messages.length===0;t.messages.push({id:w(),role:`user`,content:e}),t.updatedAt=Date.now(),r&&(t.title=T(e)),J(),z=!1,D.value=``,$(),R=!0,Y();let i=t.id;n({type:`TOQAN_CHAT`,messages:t.messages.map(e=>({id:e.id,role:e.role,content:e.content,createdAt:Date.now()})),conversationId:i}).catch(e=>{let t=I.find(e=>e.id===i);t&&(t.id===L&&(R=!1),t.messages.push({id:w(),role:`assistant`,content:e.message,error:!0}),t.updatedAt=Date.now(),J(),Y())})}chrome.runtime.onMessage.addListener(e=>{if(!(`conversationId`in e)||!e.conversationId)return;let t=I.find(t=>t.id===e.conversationId);t&&(e.type===`TOQAN_REPLY`?(t.id===L&&(R=!1),t.messages.push({id:w(),role:`assistant`,content:e.reply??``}),t.updatedAt=Date.now(),J(),t.id===L&&!z&&Y()):e.type===`TOQAN_ERROR`?(t.id===L&&(R=!1),t.messages.push({id:w(),role:`assistant`,content:e.error??`Unknown error`,error:!0}),t.updatedAt=Date.now(),J(),t.id===L&&!z&&Y()):e.type===`TOQAN_OVERLOADED`&&t.id===L&&!z&&(H?.(),H=null,b(f,`Retrying`)))}),D.addEventListener(`input`,$),D.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),se())}),O.addEventListener(`click`,se);let ce=window,le=ce.SpeechRecognition||ce.webkitSpeechRecognition;if(!le)k.style.display=`none`;else{let e=new le;e.continuous=!0,e.interimResults=!0,e.lang=navigator.language||`en-US`;let t=``;e.onresult=e=>{let n=``,r=``;for(let t=e.resultIndex;t<e.results.length;t++){let i=e.results[t];i.isFinal?r+=i[0].transcript:n+=i[0].transcript}let i=(r||n).trim();i&&(D.value=t?`${t} ${i}`:i,r&&(t=D.value),$())},e.onend=()=>{B=!1,k.classList.remove(`listening`)},e.onerror=()=>{B=!1,k.classList.remove(`listening`)},V=()=>{try{e.stop()}catch{}B=!1,k.classList.remove(`listening`),t=``},k.addEventListener(`click`,()=>{if(B)V?.();else{t=D.value;try{e.start(),B=!0,k.classList.add(`listening`)}catch{}}})}let ue=u.querySelector(`.pill-open`),de=u.querySelector(`.pill-settings`);ue.addEventListener(`click`,()=>{d.classList.add(`open`),u.classList.add(`pinned`),setTimeout(()=>D.focus(),320)}),de.addEventListener(`click`,()=>{n({type:`OPEN_SETTINGS`})}),M.addEventListener(`click`,ee),j.addEventListener(`click`,()=>{z=!z,Y()}),A.addEventListener(`click`,()=>{d.classList.remove(`open`),u.classList.remove(`pinned`)}),c=e=>{z&&(z=!1,Y());let t=`"${e}"\n\n`;D.value=D.value.trim()?`${D.value}\n\n${t}`:t,$(),d.classList.add(`open`),u.classList.add(`pinned`),setTimeout(()=>{D.focus(),D.setSelectionRange(D.value.length,D.value.length)},320)};let fe=d.querySelector(`.reload-banner`);a.push(()=>{fe.style.display=`flex`,D.disabled=!0,D.placeholder=`Refresh this page to keep chatting…`,O.disabled=!0,k.style.display=`none`,M.disabled=!0,j.disabled=!0})}var O=`ombre-ai-selection-host`,k={ask:e=>e,improve:e=>`Improve the writing quality, clarity, and flow of the following text. Return ONLY the improved text with no preamble, quotes, or explanation:\n\n${e}`,rephrase:e=>`Rephrase the following text in a different way while keeping the same meaning. Return ONLY the rephrased text with no preamble, quotes, or explanation:\n\n${e}`,addmore:e=>`Expand on the following text with more relevant detail, keeping the same tone and style. Return ONLY the expanded text with no preamble, quotes, or explanation:\n\n${e}`};function A(){if(document.getElementById(O))return;let e=document.createElement(`div`);e.id=O,document.documentElement.appendChild(e);let t=e.attachShadow({mode:`open`}),r=document.createElement(`style`);r.textContent=`
    :host { all: initial; }
    * { box-sizing: border-box; font-family: "Inter", system-ui, -apple-system, sans-serif; }

    .toolbar {
      position: fixed;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 5px;
      border-radius: 13px;
      background: #18181b;
      box-shadow: 0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07);
      opacity: 0;
      transform: translateY(6px) scale(0.97);
      transition: opacity 0.16s ease, transform 0.16s ease;
      pointer-events: none;
      overflow: visible;
    }
    .toolbar.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    .toolbar-badge {
      position: absolute;
      top: -12px;
      left: 12px;
      width: 25px;
      height: 25px;
      border-radius: 8px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      pointer-events: none;
    }
    .toolbar-badge svg { width: 13px; height: 13px; fill: #6c63ff; stroke: none; }

    .tbtn {
      display: flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: transparent;
      color: #d4d4d8;
      font-size: 12.5px;
      font-weight: 500;
      padding: 7px 11px;
      border-radius: 9px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.12s, color 0.12s;
    }
    .tbtn:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .tbtn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

    .tbtn.primary { background: #6c63ff; color: #fff; font-weight: 600; }
    .tbtn.primary:hover { background: #7d75ff; }
    .tbtn.primary svg { fill: #fff; stroke: none; }

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
    <button class="tbtn primary" data-action="ask">
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5c.4 2.7 1 4.4 2.3 5.7 1.3 1.3 3 1.9 5.7 2.3-2.7.4-4.4 1-5.7 2.3-1.3 1.3-1.9 3-2.3 5.7-.4-2.7-1-4.4-2.3-5.7-1.3-1.3-3-1.9-5.7-2.3 2.7-.4 4.4-1 5.7-2.3 1.3-1.3 1.9-3 2.3-5.7z"/></svg>
      Ask Ombre
    </button>
    <button class="tbtn" data-action="improve">
      <svg viewBox="0 0 24 24"><path d="M15 4V2m0 4V4m-4.5 3.5L9 6m1.5 1.5L9 9M4 15l11-11 3 3L7 18l-4 1 1-4z"/></svg>
      Improve
    </button>
    <button class="tbtn" data-action="rephrase">
      <svg viewBox="0 0 24 24"><path d="M17 2.1 21 6l-4 3.9M3 12v-2a4 4 0 0 1 4-4h14M7 21.9 3 18l4-3.9M21 12v2a4 4 0 0 1-4 4H3"/></svg>
      Rephrase
    </button>
    <button class="tbtn" data-action="addmore">
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
      Add more
    </button>
    <button class="tbtn addchat" title="Send to chat panel to ask more there">
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
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
  `,t.append(r,i,s);let l=s.querySelector(`.card-body`),u=s.querySelector(`.card-footer`),d=s.querySelector(`.card-close`),f=``,h=null,v=!1,b=null,S=0,C=0,w=null;function T(){i.classList.remove(`visible`)}function E(){s.classList.remove(`visible`),w=null,R?.()}function D(e){let t=e instanceof Element?e:e?.parentElement??null;for(;t;){if(t.id===`ombre-ai-edge-panel-host`||t.id===`ombre-ai-context-panel-host`||t.id===O)return!0;t=t.parentElement}return!1}function A(e){let t=e instanceof Element?e:e?.parentElement??null;for(;t;){if(t instanceof HTMLElement&&(t.isContentEditable||t.tagName===`TEXTAREA`||t.tagName===`INPUT`))return!0;t=t.parentElement}return!1}let j=new Set([`text`,`search`,`url`,`tel`,`email`,`password`,``]);function M(){let e=document.activeElement;if(D(e))return null;let t=e instanceof HTMLTextAreaElement,n=e instanceof HTMLInputElement&&j.has(e.type);if(!t&&!n)return null;let r=e,i=r.selectionStart,a=r.selectionEnd;return i==null||a==null||a<=i?null:{el:r,text:r.value.slice(i,a),start:i,end:a}}function N(e,t,n,r){let i=t.top-r-8,a=t.left+t.width/2-n/2;i<8&&(i=t.bottom+8),a<8&&(a=8),a+n>window.innerWidth-8&&(a=window.innerWidth-n-8),i+r>window.innerHeight-8&&(i=Math.max(8,window.innerHeight-r-8)),e.style.top=`${i}px`,e.style.left=`${a}px`}function P(e){if(e.width===0&&e.height===0){T();return}i.classList.add(`visible`),requestAnimationFrame(()=>{N(i,e,i.offsetWidth,i.offsetHeight)})}function F(){if(o||s.classList.contains(`visible`))return;let e=M();if(e){f=e.text.trim(),h=null,v=!0,b=e.el,S=e.start,C=e.end,P(e.el.getBoundingClientRect());return}let t=window.getSelection(),n=t?.toString().trim()??``;if(!n||!t||t.rangeCount===0){T();return}let r=t.getRangeAt(0);if(D(r.commonAncestorContainer)){T();return}f=n,h=r.cloneRange(),v=A(r.commonAncestorContainer),b=null,P(r.getBoundingClientRect())}let I;function L(){window.clearTimeout(I),I=window.setTimeout(F,120)}document.addEventListener(`selectionchange`,L),document.addEventListener(`mouseup`,L),document.addEventListener(`keyup`,e=>{(e.shiftKey||e.key===`Shift`)&&L()}),document.addEventListener(`mousedown`,e=>{D(e.target)||T()}),window.addEventListener(`scroll`,T,!0),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&(T(),E())}),d.addEventListener(`click`,E);let R=null;function z(e=[`Thinking`,`Reasoning`,`Considering`]){R?.(),l.innerHTML=`<div class="card-loading">${y(e)}</div>`,u.style.display=`none`,R=x(l,e)}function B(e,t){if(R?.(),l.innerHTML=t?`<div class="error-text">${p(e)}</div>`:m(e),t){u.style.display=`none`;return}u.style.display=`flex`,u.innerHTML=`
      <button class="card-action" data-act="copy">
        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        Copy
      </button>
      ${v?`<button class="card-action primary" data-act="replace">
              <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
              Replace
            </button>`:``}
    `,u.querySelector(`[data-act="copy"]`)?.addEventListener(`click`,async t=>{let n=t.currentTarget,r=n.innerHTML;n.innerHTML=await _(g(e))?`<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Copied`:`<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg> Couldn't copy`,n.disabled=!0,setTimeout(()=>{n.innerHTML=r,n.disabled=!1},1600)}),u.querySelector(`[data-act="replace"]`)?.addEventListener(`click`,()=>{let t=g(e);if(b)V(b,S,C,t);else if(h)try{let e=window.getSelection();e?.removeAllRanges(),e?.addRange(h),document.execCommand(`insertText`,!1,t)}catch{_(t)}E()})}function V(e,t,n,r){let i=e instanceof HTMLTextAreaElement?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype,a=Object.getOwnPropertyDescriptor(i,`value`)?.set,o=e.value.slice(0,t)+r+e.value.slice(n);a?a.call(e,o):e.value=o,e.dispatchEvent(new Event(`input`,{bubbles:!0}));let s=t+r.length;e.focus();try{e.setSelectionRange(s,s)}catch{}}function H(e){z();let t=`sel-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;w=t,n({type:`TOQAN_CHAT`,messages:[{id:`1`,role:`user`,content:e,createdAt:Date.now()}],conversationId:t}).catch(e=>{w===t&&B(e.message||`Something went wrong.`,!0)})}function U(){u.style.display=`none`;let e=f.length>140?`${f.slice(0,140)}…`:f;l.innerHTML=`
      <div class="addmore-preview">"${p(e)}"</div>
      <p class="addmore-label">What do you want to know more about? (optional — leave blank to just expand it)</p>
      <textarea class="addmore-input" rows="2" placeholder="e.g. its history, how it works, real-world examples…"></textarea>
      <button class="addmore-submit">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        Ask
      </button>
    `;let t=l.querySelector(`.addmore-input`),n=l.querySelector(`.addmore-submit`);t.focus();let r=()=>{let e=t.value.trim();H(e?`Here is a piece of text:\n\n"""${f}"""\n\nRegarding this text, the reader wants to know more about the following, so answer it clearly using the text as context: ${e}`:k.addmore(f))};n.addEventListener(`click`,r),t.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),r())})}function W(e){if(!f||o)return;let t=b?b.getBoundingClientRect():h?.getBoundingClientRect();if(T(),s.classList.add(`visible`),requestAnimationFrame(()=>{t&&N(s,t,320,e===`addmore`?210:200)}),e===`addmore`){U();return}H(k[e](f))}a.push(()=>{T(),E()}),chrome.runtime.onMessage.addListener(e=>{!e.conversationId||e.conversationId!==w||(e.type===`TOQAN_REPLY`?B(e.reply??``,!1):e.type===`TOQAN_ERROR`?B(e.error??`Unknown error`,!0):e.type===`TOQAN_OVERLOADED`&&z([`Retrying`]))}),i.querySelectorAll(`.tbtn[data-action]`).forEach(e=>{e.addEventListener(`click`,()=>W(e.dataset.action))}),i.querySelector(`.addchat`).addEventListener(`click`,()=>{o||!f||(T(),window.self===window.top&&c?c(f):n({type:`OMBRE_ADD_TO_CHAT`,text:f}).catch(()=>{}))})}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,()=>{D(),A()}):(D(),A());})()
