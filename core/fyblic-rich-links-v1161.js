/* FYBLIC V1161 — liens externes dans publications, stories et commentaires.
   N'altère pas le contenu stocké en base. Conserve les spans de mentions et badges. */
(function(){
  'use strict';
  if(window.FyblicRichLinksV1161)return;
  const TARGETS='.miniDesc,.miniTitle,.haHomeFsDesc,.haHomeFsTitle,.haCommentList p,.haCommentText,.commentText,.commentBody,.commentContent,.post-description,[data-post-description],.haStoryCaption,.storyDescription,.storyCaption,.storyDesc,.profilePostDesc,.profilePostTitle,.slideInfo .desc,.slideInfo .title,.info .desc,.info .title,.reelCaption,.reelDescription,.haPostDescription,.haPhotoDesc,.haPhotoCaption,.happyadInlineDescV991,.happyadStoryDescription,#hsvCaption,.hsvCaption';
  const FORMAT=/\[([^\]\n]{1,100})\]\((https?:\/\/[^\s<>)]+)\)|https?:\/\/[^\s<>"']+/gi;
  const editorSelector='textarea.haCommentInputV905,textarea#haPostEditDescV63,textarea[placeholder*="description" i],textarea[aria-label*="description" i],textarea[name*="description" i],textarea[name*="caption" i]';
  const linkSelectors='a,[role="link"],button,script,style,code,pre,textarea,input,[contenteditable="true"],[data-fyblic-rich-link],.happyadMentionBlueV941,.happyadCommentMentionV992,[data-happyad-mention-handle],[data-happyad-comment-mention-v992]';
  function normalized(url){
    try{const u=new URL(String(url||''));if(!/^https?:$/.test(u.protocol)||!u.hostname||u.username||u.password)return '';
      if(/^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])$/i.test(u.hostname))return '';
      return u.href;
    }catch(_){return '';}
  }
  function makeAnchor(label,href){const a=document.createElement('a');a.textContent=label;a.href=href;a.rel='noopener noreferrer';a.target='_blank';a.className='fyblic-rich-link-v1160';a.dataset.fyblicRichLink='1';return a;}
  function linkifyNode(n){
    if(!n||n.nodeType!==3||!n.parentElement||!n.nodeValue)return;
    const parent=n.parentElement;
    if(parent.closest(linkSelectors)||!parent.closest(TARGETS))return;
    const src=n.nodeValue;FORMAT.lastIndex=0;
    if(!FORMAT.test(src))return;
    FORMAT.lastIndex=0;
    let match,last=0,changed=false;const frag=document.createDocumentFragment();
    while((match=FORMAT.exec(src))){
      let raw=match[2]||match[0],label=match[1]||match[0],end=match.index+match[0].length;
      if(!match[2]){const trimmed=raw.replace(/[.,!?;:]+$/,'');const removed=raw.length-trimmed.length;raw=trimmed;label=trimmed;end-=removed;}
      const href=normalized(raw);if(!href||!label)continue;
      frag.appendChild(document.createTextNode(src.slice(last,match.index)));
      frag.appendChild(makeAnchor(label,href));last=end;changed=true;
    }
    if(!changed)return;frag.appendChild(document.createTextNode(src.slice(last)));n.replaceWith(frag);
  }
  function process(el){
    if(!el||el.nodeType!==1)return;
    if(el.matches&&el.matches(TARGETS))walk(el);
    if(el.querySelectorAll)el.querySelectorAll(TARGETS).forEach(walk);
    if(el.matches&&el.matches(editorSelector))buttonFor(el);
    if(el.querySelectorAll)el.querySelectorAll(editorSelector).forEach(buttonFor);
  }
  function walk(el){
    if(!el||el.closest(linkSelectors))return;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(linkifyNode);
  }
  function buttonFor(input){
    if(!input||input.dataset.fyblicLinkEditor==='1'||input.closest('[data-fyblic-rich-link]'))return;
    input.dataset.fyblicLinkEditor='1';
    const btn=document.createElement('button');btn.type='button';btn.className='fyblic-insert-link-v1160';btn.textContent='🔗';btn.title='Attacher un lien à un mot';btn.setAttribute('aria-label','Insérer un lien');
    btn.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      const a=input.selectionStart||0,b=input.selectionEnd||a,selection=input.value.slice(a,b);
      const label=window.prompt('Texte visible pour le lien',selection||'Cliquez ici');if(label===null)return;
      const url=window.prompt('Adresse du site ou de l’application (https://...)','https://');if(url===null)return;
      const safe=normalized(url.trim());if(!safe){window.alert('Adresse invalide : utilisez un lien HTTP ou HTTPS public.');return;}
      const shown=label.trim().replace(/[\]\[\n]/g,' ').slice(0,100);if(!shown)return;
      const mark='['+shown+']('+safe+')';input.setRangeText(mark,a,b,'end');
      input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
    });
    input.parentNode.insertBefore(btn,input);
  }
  let scheduled=false;const dirty=new Set();
  function queue(el){if(el&&el.nodeType===1)dirty.add(el);if(scheduled)return;scheduled=true;
    requestAnimationFrame(function(){scheduled=false;const batch=Array.from(dirty);dirty.clear();batch.forEach(process);});
  }
  function start(){
    queue(document.body);
    const observer=new MutationObserver(function(records){records.forEach(function(m){
      if(m.type==='characterData'){if(m.target.parentElement)queue(m.target.parentElement);return;}
      if(m.type==='childList')m.addedNodes.forEach(function(n){if(n.nodeType===1)queue(n);else if(n.nodeType===3&&n.parentElement)queue(n.parentElement);});
    });});observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  // Handle text links in capture phase before Fyblic's card/profile/video handlers.
  // Explicit navigation is needed: a delegated profile tap must never steal a link.
  function anchorOf(event){
    const target=event.target;
    return target&&target.closest ? target.closest('a.fyblic-rich-link-v1160') : null;
  }
  function guardRichLinkGesture(event){
    if(anchorOf(event)){
      // Never preventDefault on pointer/touch: preserve native taps and scrolling.
      event.stopPropagation();
      if(event.stopImmediatePropagation)event.stopImmediatePropagation();
    }
  }
  ['pointerdown','pointerup','touchstart','touchend'].forEach(function(type){
    window.addEventListener(type,guardRichLinkGesture,{capture:true,passive:true});
  });
  window.addEventListener('click',function(event){
    const anchor=anchorOf(event);
    if(!anchor)return;
    const href=normalized(anchor.getAttribute('href'));
    event.preventDefault();
    event.stopPropagation();
    if(event.stopImmediatePropagation)event.stopImmediatePropagation();
    if(!href)return;
    try{
      const destination=new URL(href);
      // Existing /s/ routing on Fyblic resolves the exact publication. Do not
      // alter shared-link generation, callbacks, preview cards or assetlinks.
      const own=destination.hostname==='fyblic.com'||destination.hostname==='www.fyblic.com';
      if(own){window.location.assign(href);return;}
      // Trusted user click: external application/browser handles http(s) link.
      const opened=window.open(href,'_blank');
      if(opened){try{opened.opener=null;}catch(_){}}
      else window.location.assign(href);
    }catch(_){
      window.location.assign(href);
    }
  },true);
  window.FyblicRichLinksV1161={version:'1162',normalized:normalized,refresh:function(){queue(document.body);}};
  window.FyblicRichLinksV1160=window.FyblicRichLinksV1161;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
