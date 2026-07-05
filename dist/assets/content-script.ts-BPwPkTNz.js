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
    .close { cursor: pointer; background: none; border: none; color: #8b8b95; font-size: 16px; line-height: 1; padding: 4px; border-radius: 6px; }
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
      <button class="close" aria-label="Close">✕</button>
    </div>
    <div class="body">
      ${e?`<div class="query">${f(e)}</div>`:``}
      <div class="${n?`answer error`:`answer`}">${n?f(n):p(t||``)}</div>
    </div>
  `,a.querySelector(`.close`)?.addEventListener(`click`,()=>{document.getElementById(l)?.remove()}),r.appendChild(i),r.appendChild(a)}function f(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}function p(e){let t=f(e).replace(/\r\n/g,`
`).split(`
`),n=``,r=null,i=()=>{r&&=(n+=r===`ul`?`</ul>`:`</ol>`,null)};for(let e of t){let t=e.trim(),a=/^[-*•]\s+(.*)$/.exec(t),o=/^\d+[.)]\s+(.*)$/.exec(t);a?(r!==`ul`&&(i(),n+=`<ul>`,r=`ul`),n+=`<li>${m(a[1])}</li>`):o?(r!==`ol`&&(i(),n+=`<ol>`,r=`ol`),n+=`<li>${m(o[1])}</li>`):(i(),t===``?n+=`<div class="md-gap"></div>`:n+=`<p>${m(t)}</p>`)}return i(),n}function m(e){return e.replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`).replace(/__(.+?)__/g,`<strong>$1</strong>`).replace(/`([^`]+?)`/g,`<code>$1</code>`).replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g,`<em>$1</em>`).replace(/(?<!_)_([^_\n]+?)_(?!_)/g,`<em>$1</em>`)}chrome.runtime.onMessage.addListener(e=>{if(e.type===`TOQAN_CONTEXT_RESPONSE`){let t=e;d({type:t.type,query:t.query,response:t.response})}else if(e.type===`TOQAN_CONTEXT_ERROR`){let t=e;d({type:t.type,error:t.error})}else e.type===`OMBRE_ADD_TO_CHAT`&&`text`in e&&e.text&&c?.(e.text)});var h=`ombre-ai-edge-panel-host`,g=`toqan_edge_conversations`;function _(){return`edge-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}function v(e){let t=e.trim().replace(/\s+/g,` `);return t.length>42?`${t.slice(0,42)}…`:t||`New chat`}function y(e){let t=Date.now()-e,n=Math.floor(t/6e4);if(n<1)return`Just now`;if(n<60)return`${n}m ago`;let r=Math.floor(n/60);if(r<24)return`${r}h ago`;let i=Math.floor(r/24);return i<7?`${i}d ago`:new Date(e).toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function b(){if(window.self!==window.top||document.getElementById(h))return;let t=document.createElement(`div`);t.id=h,document.documentElement.appendChild(t);let o=t.attachShadow({mode:`open`}),s=document.createElement(`style`);s.textContent=`
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
      background: #6c63ff;
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
      background: #6c63ff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #000000;
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

    .body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
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

    .thinking { display: flex; gap: 4px; padding: 10px 12px; background: #17171a; border-radius: 14px; border-top-left-radius: 4px; width: fit-content; }
    .thinking span { width: 5px; height: 5px; border-radius: 999px; background: #8b8b95; animation: pulse 1.4s ease-in-out infinite; }
    .thinking span:nth-child(2) { animation-delay: 0.15s; }
    .thinking span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes pulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

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
    <div class="body"></div>
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
  `,o.append(s,l,u);let d=u.querySelector(`.body`),m=u.querySelector(`textarea`),b=u.querySelector(`.send`),x=u.querySelector(`.mic`),S=u.querySelector(`.close`),C=u.querySelector(`.history`),w=u.querySelector(`.newchat`),T=[],E=null,D=!1,O=!1,k=!1,A=null;function j(){return T.find(e=>e.id===E)??null}r([g]).then(e=>{T=e[g]||[],E=T[0]?.id??null,L()});function M(){T.sort((e,t)=>t.updatedAt-e.updatedAt);let e=T.slice(0,30).map(e=>({...e,messages:e.messages.slice(-200)}));i({[g]:e})}function N(){let e=j();if(e&&e.messages.length===0){O=!1,L();return}let t={id:_(),title:`New chat`,createdAt:Date.now(),updatedAt:Date.now(),messages:[]};T.unshift(t),E=t.id,O=!1,M(),L()}function P(){let e=j();if(e)return e;let t={id:_(),title:`New chat`,createdAt:Date.now(),updatedAt:Date.now(),messages:[]};return T.unshift(t),E=t.id,t}function F(e){E=e,O=!1,D=!1,L()}function I(e){T=T.filter(t=>t.id!==e),E===e&&(E=T[0]?.id??null),M(),L()}function L(){O?(C.classList.add(`active`),R()):(C.classList.remove(`active`),z())}function R(){if(T.length===0){d.innerHTML=`<div class="history-empty">No past chats yet. Start one and it'll show up here.</div>`;return}d.innerHTML=`<div class="history-list">${T.map(e=>`
      <div class="history-item${e.id===E?` active`:``}" data-id="${e.id}">
        <div class="history-item-main">
          <div class="history-item-title">${f(e.title)}</div>
          <div class="history-item-time">${y(e.updatedAt)} · ${e.messages.length} message${e.messages.length===1?``:`s`}</div>
        </div>
        <button class="history-item-del" data-id="${e.id}" aria-label="Delete chat" title="Delete chat">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </div>`).join(``)}</div>`,d.querySelectorAll(`.history-item`).forEach(e=>{e.addEventListener(`click`,()=>F(e.dataset.id))}),d.querySelectorAll(`.history-item-del`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),I(e.dataset.id)})})}function z(){let e=j()?.messages??[];if(e.length===0&&!D){d.innerHTML=`<div class="empty"><div class="title">Ombre AI</div>Ask a question about this page, or anything else — right from here.</div>`;return}d.innerHTML=e.map(e=>`
      <div class="row ${e.role}">
        <div class="avatar ${e.role}">
          ${e.role===`user`?`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`:`<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>`}
        </div>
        <div class="bubble ${e.role}${e.error?` error`:``}">${e.role===`assistant`&&!e.error?p(e.content):f(e.content)}</div>
      </div>`).join(``),D&&(d.innerHTML+=`<div class="row assistant"><div class="avatar assistant"><svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg></div><div class="thinking"><span></span><span></span><span></span></div></div>`),d.scrollTo({top:d.scrollHeight,behavior:`smooth`})}function B(){m.style.height=`auto`,m.style.height=`${Math.min(m.scrollHeight,120)}px`}function V(){let e=m.value.trim();if(!e||D)return;k&&A?.();let t=P(),r=t.messages.length===0;t.messages.push({id:_(),role:`user`,content:e}),t.updatedAt=Date.now(),r&&(t.title=v(e)),M(),O=!1,m.value=``,B(),D=!0,L();let i=t.id;n({type:`TOQAN_CHAT`,messages:t.messages.map(e=>({id:e.id,role:e.role,content:e.content,createdAt:Date.now()})),conversationId:i}).catch(e=>{let t=T.find(e=>e.id===i);t&&(t.id===E&&(D=!1),t.messages.push({id:_(),role:`assistant`,content:e.message,error:!0}),t.updatedAt=Date.now(),M(),L())})}chrome.runtime.onMessage.addListener(e=>{if(!(`conversationId`in e)||!e.conversationId)return;let t=T.find(t=>t.id===e.conversationId);t&&(e.type===`TOQAN_REPLY`?(t.id===E&&(D=!1),t.messages.push({id:_(),role:`assistant`,content:e.reply??``}),t.updatedAt=Date.now(),M(),t.id===E&&!O&&L()):e.type===`TOQAN_ERROR`&&(t.id===E&&(D=!1),t.messages.push({id:_(),role:`assistant`,content:e.error??`Unknown error`,error:!0}),t.updatedAt=Date.now(),M(),t.id===E&&!O&&L()))}),m.addEventListener(`input`,B),m.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),V())}),b.addEventListener(`click`,V);let H=window,U=H.SpeechRecognition||H.webkitSpeechRecognition;if(!U)x.style.display=`none`;else{let e=new U;e.continuous=!0,e.interimResults=!0,e.lang=navigator.language||`en-US`;let t=``;e.onresult=e=>{let n=``,r=``;for(let t=e.resultIndex;t<e.results.length;t++){let i=e.results[t];i.isFinal?r+=i[0].transcript:n+=i[0].transcript}let i=(r||n).trim();i&&(m.value=t?`${t} ${i}`:i,r&&(t=m.value),B())},e.onend=()=>{k=!1,x.classList.remove(`listening`)},e.onerror=()=>{k=!1,x.classList.remove(`listening`)},A=()=>{try{e.stop()}catch{}k=!1,x.classList.remove(`listening`),t=``},x.addEventListener(`click`,()=>{if(k)A?.();else{t=m.value;try{e.start(),k=!0,x.classList.add(`listening`)}catch{}}})}let W=l.querySelector(`.pill-open`),G=l.querySelector(`.pill-settings`);W.addEventListener(`click`,()=>{u.classList.add(`open`),l.classList.add(`pinned`),setTimeout(()=>m.focus(),320)}),G.addEventListener(`click`,()=>{n({type:`OPEN_SETTINGS`})}),w.addEventListener(`click`,N),C.addEventListener(`click`,()=>{O=!O,L()}),S.addEventListener(`click`,()=>{u.classList.remove(`open`),l.classList.remove(`pinned`)}),c=e=>{O&&(O=!1,L());let t=`"${e}"\n\n`;m.value=m.value.trim()?`${m.value}\n\n${t}`:t,B(),u.classList.add(`open`),l.classList.add(`pinned`),setTimeout(()=>{m.focus(),m.setSelectionRange(m.value.length,m.value.length)},320)};let K=u.querySelector(`.reload-banner`);a.push(()=>{K.style.display=`flex`,m.disabled=!0,m.placeholder=`Refresh this page to keep chatting…`,b.disabled=!0,x.style.display=`none`,w.disabled=!0,C.disabled=!0})}var x=`ombre-ai-selection-host`,S={ask:e=>e,improve:e=>`Improve the writing quality, clarity, and flow of the following text. Return ONLY the improved text with no preamble, quotes, or explanation:\n\n${e}`,rephrase:e=>`Rephrase the following text in a different way while keeping the same meaning. Return ONLY the rephrased text with no preamble, quotes, or explanation:\n\n${e}`,addmore:e=>`Expand on the following text with more relevant detail, keeping the same tone and style. Return ONLY the expanded text with no preamble, quotes, or explanation:\n\n${e}`};function C(){if(document.getElementById(x))return;let e=document.createElement(`div`);e.id=x,document.documentElement.appendChild(e);let t=e.attachShadow({mode:`open`}),r=document.createElement(`style`);r.textContent=`
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

    .card-loading { display: flex; gap: 4px; align-items: center; padding: 2px 0; }
    .card-loading span { width: 5px; height: 5px; border-radius: 999px; background: #8b8b95; animation: sel-pulse 1.4s ease-in-out infinite; }
    .card-loading span:nth-child(2) { animation-delay: 0.15s; }
    .card-loading span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes sel-pulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

    .card-footer { display: flex; gap: 6px; padding: 9px 11px; border-top: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
    .card-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px; border: none; background: #1c1c20; color: #e6e6ea; font-size: 12px; font-weight: 500; padding: 7px 8px; border-radius: 8px; cursor: pointer; transition: background 0.12s; }
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
  `,t.append(r,i,s);let l=s.querySelector(`.card-body`),u=s.querySelector(`.card-footer`),d=s.querySelector(`.card-close`),m=``,h=null,g=!1,_=null,v=0,y=0,b=null;function C(){i.classList.remove(`visible`)}function w(){s.classList.remove(`visible`),b=null}function T(e){let t=e instanceof Element?e:e?.parentElement??null;for(;t;){if(t.id===`ombre-ai-edge-panel-host`||t.id===`ombre-ai-context-panel-host`||t.id===x)return!0;t=t.parentElement}return!1}function E(e){let t=e instanceof Element?e:e?.parentElement??null;for(;t;){if(t instanceof HTMLElement&&(t.isContentEditable||t.tagName===`TEXTAREA`||t.tagName===`INPUT`))return!0;t=t.parentElement}return!1}let D=new Set([`text`,`search`,`url`,`tel`,`email`,`password`,``]);function O(){let e=document.activeElement;if(T(e))return null;let t=e instanceof HTMLTextAreaElement,n=e instanceof HTMLInputElement&&D.has(e.type);if(!t&&!n)return null;let r=e,i=r.selectionStart,a=r.selectionEnd;return i==null||a==null||a<=i?null:{el:r,text:r.value.slice(i,a),start:i,end:a}}function k(e,t,n,r){let i=t.top-r-8,a=t.left+t.width/2-n/2;i<8&&(i=t.bottom+8),a<8&&(a=8),a+n>window.innerWidth-8&&(a=window.innerWidth-n-8),i+r>window.innerHeight-8&&(i=Math.max(8,window.innerHeight-r-8)),e.style.top=`${i}px`,e.style.left=`${a}px`}function A(e){if(e.width===0&&e.height===0){C();return}i.classList.add(`visible`),requestAnimationFrame(()=>{k(i,e,i.offsetWidth,i.offsetHeight)})}function j(){if(o||s.classList.contains(`visible`))return;let e=O();if(e){m=e.text.trim(),h=null,g=!0,_=e.el,v=e.start,y=e.end,A(e.el.getBoundingClientRect());return}let t=window.getSelection(),n=t?.toString().trim()??``;if(!n||!t||t.rangeCount===0){C();return}let r=t.getRangeAt(0);if(T(r.commonAncestorContainer)){C();return}m=n,h=r.cloneRange(),g=E(r.commonAncestorContainer),_=null,A(r.getBoundingClientRect())}let M;function N(){window.clearTimeout(M),M=window.setTimeout(j,120)}document.addEventListener(`selectionchange`,N),document.addEventListener(`mouseup`,N),document.addEventListener(`keyup`,e=>{(e.shiftKey||e.key===`Shift`)&&N()}),document.addEventListener(`mousedown`,e=>{T(e.target)||(C(),w())}),window.addEventListener(`scroll`,C,!0),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&(C(),w())}),d.addEventListener(`click`,w);function P(){l.innerHTML=`<div class="card-loading"><span></span><span></span><span></span></div>`,u.style.display=`none`}function F(e,t){if(l.innerHTML=t?`<div class="error-text">${f(e)}</div>`:p(e),t){u.style.display=`none`;return}u.style.display=`flex`,u.innerHTML=`
      <button class="card-action" data-act="copy">
        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        Copy
      </button>
      ${g?`<button class="card-action primary" data-act="replace">
              <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
              Replace
            </button>`:``}
    `,u.querySelector(`[data-act="copy"]`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(e).catch(()=>{})}),u.querySelector(`[data-act="replace"]`)?.addEventListener(`click`,()=>{if(_)I(_,v,y,e);else if(h)try{let t=window.getSelection();t?.removeAllRanges(),t?.addRange(h),document.execCommand(`insertText`,!1,e)}catch{navigator.clipboard.writeText(e).catch(()=>{})}w()})}function I(e,t,n,r){let i=e instanceof HTMLTextAreaElement?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype,a=Object.getOwnPropertyDescriptor(i,`value`)?.set,o=e.value.slice(0,t)+r+e.value.slice(n);a?a.call(e,o):e.value=o,e.dispatchEvent(new Event(`input`,{bubbles:!0}));let s=t+r.length;e.focus();try{e.setSelectionRange(s,s)}catch{}}function L(e){P();let t=`sel-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;b=t,n({type:`TOQAN_CHAT`,messages:[{id:`1`,role:`user`,content:e,createdAt:Date.now()}],conversationId:t}).catch(e=>{b===t&&F(e.message||`Something went wrong.`,!0)})}function R(){u.style.display=`none`;let e=m.length>140?`${m.slice(0,140)}…`:m;l.innerHTML=`
      <div class="addmore-preview">"${f(e)}"</div>
      <p class="addmore-label">What do you want to know more about? (optional — leave blank to just expand it)</p>
      <textarea class="addmore-input" rows="2" placeholder="e.g. its history, how it works, real-world examples…"></textarea>
      <button class="addmore-submit">
        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        Ask
      </button>
    `;let t=l.querySelector(`.addmore-input`),n=l.querySelector(`.addmore-submit`);t.focus();let r=()=>{let e=t.value.trim();L(e?`Here is a piece of text:\n\n"""${m}"""\n\nRegarding this text, the reader wants to know more about the following, so answer it clearly using the text as context: ${e}`:S.addmore(m))};n.addEventListener(`click`,r),t.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),r())})}function z(e){if(!m||o)return;let t=_?_.getBoundingClientRect():h?.getBoundingClientRect();if(C(),s.classList.add(`visible`),requestAnimationFrame(()=>{t&&k(s,t,320,e===`addmore`?210:200)}),e===`addmore`){R();return}L(S[e](m))}a.push(()=>{C(),w()}),chrome.runtime.onMessage.addListener(e=>{!e.conversationId||e.conversationId!==b||(e.type===`TOQAN_REPLY`?F(e.reply??``,!1):e.type===`TOQAN_ERROR`&&F(e.error??`Unknown error`,!0))}),i.querySelectorAll(`.tbtn[data-action]`).forEach(e=>{e.addEventListener(`click`,()=>z(e.dataset.action))}),i.querySelector(`.addchat`).addEventListener(`click`,()=>{o||!m||(C(),window.self===window.top&&c?c(m):n({type:`OMBRE_ADD_TO_CHAT`,text:m}).catch(()=>{}))})}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,()=>{b(),C()}):(b(),C());