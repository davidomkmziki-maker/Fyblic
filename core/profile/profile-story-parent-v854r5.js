(function(){
'use strict';
if(window.__HAPPYAD_PROFILE_STORY_PARENT_V854R5__)return;
window.__HAPPYAD_PROFILE_STORY_PARENT_V854R5__=true;
function clean(v){return String(v==null?'':v).trim();}
function normalizeBadge(v){var s=clean(v).toLowerCase();if(!s||['aucun','none','false','0','1','true','null','undefined'].indexOf(s)>=0)return '';if(s.indexOf('rose')>=0||s.indexOf('pink')>=0)return 'rose';if(s.indexOf('bleu')>=0||s.indexOf('blue')>=0)return 'bleu';if(s.indexOf('violet')>=0||s.indexOf('purple')>=0||s.indexOf('jaune')>=0||s.indexOf('yellow')>=0||s.indexOf('business')>=0)return 'violet';return '';}
window.normHappyBadge=normalizeBadge;
window.badgeMarkHtml=function(v){var b=normalizeBadge(v);return b?'<span class="happyBadgeMark '+b+'"></span>':'';};
var style=document.createElement('style');style.id='happyad-profile-story-badge-v854r5';style.textContent='.happyBadgeMark.rose:before,.happyBadgeMark.pink:before{background:linear-gradient(135deg,#ffb4d4,#ff5ca8,#e60073)!important;box-shadow:0 0 3px rgba(255,92,168,.55),0 0 9px rgba(230,0,115,.30)!important}';document.head.appendChild(style);
function open(d){d=d||{};var owner=clean(d.owner_id||d.user_id||(d.item&&(d.item.creatorId||d.item.user_id))),sid=clean(d.story_id||(d.item&&(d.item.story_id||d.item.id))),item=d.item||null;if(!owner)return false;try{var api=window.HappyStoryV699||window.HappyStoryV629;if(api&&typeof api.openOwner==='function'){api.openOwner(owner,sid,item);return true;}if(item&&typeof window.openHappyadStoryViewer==='function'){window.openHappyadStoryViewer(item);return true;}}catch(_e){}return false;}
window.addEventListener('message',function(e){var d=e&&e.data;if(d&&d.type==='HAPPYAD_OPEN_PROFILE_STORY_V854R5')open(d);},true);
window.HappyProfileStoryParentV854R5={open:open,normalizeBadge:normalizeBadge};
})();
