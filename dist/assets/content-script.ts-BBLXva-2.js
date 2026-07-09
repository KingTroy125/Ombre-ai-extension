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
  `,o.append(s,l,u);let d=u.querySelector(`.body`);d.setAttribute(`role`,`log`),d.setAttribute(`aria-relevant`,`additions`);let m=u.querySelector(`.jump-btn`),b=u.querySelector(`.jump-btn-label`),x=u.querySelector(`textarea`),S=u.querySelector(`.send`),C=u.querySelector(`.mic`),w=u.querySelector(`.close`),T=u.querySelector(`.history`),E=u.querySelector(`.newchat`),D=[],O=null,k=!1,A=!1,j=!1,M=null,N=!0;function P(){return d.scrollHeight-d.scrollTop-d.clientHeight<56}function F(e){N=e,m.style.display=e?`none`:`flex`,e&&(b.textContent=`Jump to latest`)}function I(e=`smooth`){d.scrollTo({top:d.scrollHeight,behavior:e}),F(!0)}d.addEventListener(`scroll`,()=>{let e=P();e!==N&&F(e)}),m.addEventListener(`click`,()=>I());function L(){return D.find(e=>e.id===O)??null}r([g]).then(e=>{D=e[g]||[],O=D[0]?.id??null,U()});function R(){D.sort((e,t)=>t.updatedAt-e.updatedAt);let e=D.slice(0,30).map(e=>({...e,messages:e.messages.slice(-200)}));i({[g]:e})}function z(){let e=L();if(e&&e.messages.length===0){A=!1,U();return}let t={id:_(),title:`New chat`,createdAt:Date.now(),updatedAt:Date.now(),messages:[]};D.unshift(t),O=t.id,A=!1,R(),U()}function B(){let e=L();if(e)return e;let t={id:_(),title:`New chat`,createdAt:Date.now(),updatedAt:Date.now(),messages:[]};return D.unshift(t),O=t.id,t}function V(e){O=e,A=!1,k=!1,U()}function H(e){D=D.filter(t=>t.id!==e),O===e&&(O=D[0]?.id??null),R(),U()}function U(){A?(T.classList.add(`active`),W()):(T.classList.remove(`active`),Y())}function W(){if(D.length===0){d.innerHTML=`<div class="history-empty">No past chats yet. Start one and it'll show up here.</div>`;return}d.innerHTML=`<div class="history-list">${D.map(e=>`
      <div class="history-item${e.id===O?` active`:``}" data-id="${e.id}">
        <div class="history-item-main">
          <div class="history-item-title">${f(e.title)}</div>
          <div class="history-item-time">${y(e.updatedAt)} · ${e.messages.length} message${e.messages.length===1?``:`s`}</div>
        </div>
        <button class="history-item-del" data-id="${e.id}" aria-label="Delete chat" title="Delete chat">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </div>`).join(``)}</div>`,d.querySelectorAll(`.history-item`).forEach(e=>{e.addEventListener(`click`,()=>V(e.dataset.id))}),d.querySelectorAll(`.history-item-del`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation(),H(e.dataset.id)})})}let G=null,K=0,q=null;function J(e){let t=d.querySelector(`[data-msg-id="${e}"]`);if(!t)return;let n=t.getBoundingClientRect().top-d.getBoundingClientRect().top-12;d.scrollTo({top:d.scrollTop+n,behavior:`smooth`})}function Y(){let e=L(),t=e?.messages??[],n=e?.id??null;d.setAttribute(`aria-busy`,String(k));let r=N,i=d.scrollTop,a=n!==G,o=t[t.length-1],s=!!o&&o.id!==q&&!a&&o.role===`user`,c=!a&&t.length>K;if(t.length===0&&!k){d.innerHTML=`<div class="empty"><div class="title">Ombre AI</div>Ask a question about this page, or anything else — right from here.</div>`,G=n,K=0,q=null,F(!0);return}d.innerHTML=t.map(e=>`
      <div class="row ${e.role}" data-msg-id="${e.id}">
        <div class="avatar ${e.role}">
          ${e.role===`user`?`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`:`<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>`}
        </div>
        <div class="bubble ${e.role}${e.error?` error`:``}">${e.role===`assistant`&&!e.error?p(e.content):f(e.content)}</div>
      </div>`).join(``),k&&(d.innerHTML+=`<div class="row assistant"><div class="avatar assistant"><svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg></div><div class="thinking"><span></span><span></span><span></span></div></div>`),G=n,K=t.length,q=o?.id??null,s?(requestAnimationFrame(()=>J(o.id)),F(!1)):a?I(`auto`):r?I(`smooth`):(d.scrollTop=i,c&&(b.textContent=`New message`,m.style.display=`flex`))}function X(){x.style.height=`auto`,x.style.height=`${Math.min(x.scrollHeight,120)}px`}function Z(){let e=x.value.trim();if(!e||k)return;j&&M?.();let t=B(),r=t.messages.length===0;t.messages.push({id:_(),role:`user`,content:e}),t.updatedAt=Date.now(),r&&(t.title=v(e)),R(),A=!1,x.value=``,X(),k=!0,U();let i=t.id;n({type:`TOQAN_CHAT`,messages:t.messages.map(e=>({id:e.id,role:e.role,content:e.content,createdAt:Date.now()})),conversationId:i}).catch(e=>{let t=D.find(e=>e.id===i);t&&(t.id===O&&(k=!1),t.messages.push({id:_(),role:`assistant`,content:e.message,error:!0}),t.updatedAt=Date.now(),R(),U())})}chrome.runtime.onMessage.addListener(e=>{if(!(`conversationId`in e)||!e.conversationId)return;let t=D.find(t=>t.id===e.conversationId);t&&(e.type===`TOQAN_REPLY`?(t.id===O&&(k=!1),t.messages.push({id:_(),role:`assistant`,content:e.reply??``}),t.updatedAt=Date.now(),R(),t.id===O&&!A&&U()):e.type===`TOQAN_ERROR`&&(t.id===O&&(k=!1),t.messages.push({id:_(),role:`assistant`,content:e.error??`Unknown error`,error:!0}),t.updatedAt=Date.now(),R(),t.id===O&&!A&&U()))}),x.addEventListener(`input`,X),x.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),Z())}),S.addEventListener(`click`,Z);let Q=window,$=Q.SpeechRecognition||Q.webkitSpeechRecognition;if(!$)C.style.display=`none`;else{let e=new $;e.continuous=!0,e.interimResults=!0,e.lang=navigator.language||`en-US`;let t=``;e.onresult=e=>{let n=``,r=``;for(let t=e.resultIndex;t<e.results.length;t++){let i=e.results[t];i.isFinal?r+=i[0].transcript:n+=i[0].transcript}let i=(r||n).trim();i&&(x.value=t?`${t} ${i}`:i,r&&(t=x.value),X())},e.onend=()=>{j=!1,C.classList.remove(`listening`)},e.onerror=()=>{j=!1,C.classList.remove(`listening`)},M=()=>{try{e.stop()}catch{}j=!1,C.classList.remove(`listening`),t=``},C.addEventListener(`click`,()=>{if(j)M?.();else{t=x.value;try{e.start(),j=!0,C.classList.add(`listening`)}catch{}}})}let ee=l.querySelector(`.pill-open`),te=l.querySelector(`.pill-settings`);ee.addEventListener(`click`,()=>{u.classList.add(`open`),l.classList.add(`pinned`),setTimeout(()=>x.focus(),320)}),te.addEventListener(`click`,()=>{n({type:`OPEN_SETTINGS`})}),E.addEventListener(`click`,z),T.addEventListener(`click`,()=>{A=!A,U()}),w.addEventListener(`click`,()=>{u.classList.remove(`open`),l.classList.remove(`pinned`)}),c=e=>{A&&(A=!1,U());let t=`"${e}"\n\n`;x.value=x.value.trim()?`${x.value}\n\n${t}`:t,X(),u.classList.add(`open`),l.classList.add(`pinned`),setTimeout(()=>{x.focus(),x.setSelectionRange(x.value.length,x.value.length)},320)};let ne=u.querySelector(`.reload-banner`);a.push(()=>{ne.style.display=`flex`,x.disabled=!0,x.placeholder=`Refresh this page to keep chatting…`,S.disabled=!0,C.style.display=`none`,E.disabled=!0,T.disabled=!0})}var x=`ombre-ai-selection-host`,S={ask:e=>e,improve:e=>`Improve the writing quality, clarity, and flow of the following text. Return ONLY the improved text with no preamble, quotes, or explanation:\n\n${e}`,rephrase:e=>`Rephrase the following text in a different way while keeping the same meaning. Return ONLY the rephrased text with no preamble, quotes, or explanation:\n\n${e}`,addmore:e=>`Expand on the following text with more relevant detail, keeping the same tone and style. Return ONLY the expanded text with no preamble, quotes, or explanation:\n\n${e}`};function C(){if(document.getElementById(x))return;let e=document.createElement(`div`);e.id=x,document.documentElement.appendChild(e);let t=e.attachShadow({mode:`open`}),r=document.createElement(`style`);r.textContent=`
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
      <span class="ticon c-improve"><svg viewBox="0 0 24 24"><path d="m12 3 1.9 4.9L19 9.8l-4.9 1.9L12 17l-1.9-4.9L5 10.2l4.9-1.9L12 3z"/></svg></span>
      Improve
    </button>
    <button class="tbtn" data-action="rephrase">
      <span class="ticon c-rephrase"><svg viewBox="0 0 24 24"><path d="M17 2.1 21 6l-4 3.9M3 12v-2a4 4 0 0 1 4-4h14M7 21.9 3 18l4-3.9M21 12v2a4 4 0 0 1-4 4H3"/></svg></span>
      Rephrase
    </button>
    <button class="tbtn" data-action="addmore">
      <span class="ticon c-addmore"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>
      Add more
    </button>
    <button class="tbtn addchat" title="Send to chat panel to ask more there">
      <span class="ticon c-chat"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
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