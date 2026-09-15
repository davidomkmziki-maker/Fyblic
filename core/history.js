(function(){
  'use strict';
  if(window.HappyHistory)return;
  var stack=[];
  function current(){return stack.length?stack[stack.length-1]:{name:'home',params:{}};}
  window.HappyHistory={
    push:function(route){route=route||{name:'home',params:{}};stack.push(route);try{if(window.HappyState)HappyState.route(route.name,route.params,'history-push');}catch(_e){}return route;},
    replace:function(route){route=route||{name:'home',params:{}};if(stack.length)stack[stack.length-1]=route;else stack.push(route);try{if(window.HappyState)HappyState.route(route.name,route.params,'history-replace');}catch(_e){}return route;},
    back:function(){return current();},
    current:current, reset:function(route){stack=[route||{name:'home',params:{}}];return current();}, stack:function(){return stack.slice();}
  };
})();
