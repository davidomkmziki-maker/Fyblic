/* V1125: one source transition with metadata seek, resume, rollback and cancellation. */
(function () {
  'use strict';
  function switchSource(video, url, options) {
    options = options || {};
    if (!video || !url || !video.isConnected) return Promise.resolve(false);
    if (video.__fyblicSwitch && video.__fyblicSwitch.url === url) return video.__fyblicSwitch.promise;
    if (video.__fyblicSwitch) {
      var previous=video.__fyblicSwitch;
      if(previous.committed)return previous.promise.then(function(){
        if(options.allowed&&!options.allowed())return false;
        return switchSource(video,url,Object.assign({},options,{resume:previous.wasPlaying}));
      });
      previous.cancel();
    }
    if (String(video.currentSrc || video.src || '') === url) return Promise.resolve(true);
    var old = video.currentSrc || video.src, probe = document.createElement('video');
    var resolveTask, timer, finished = false, committed = false, restoring = false;
    var keep = 0, playing = false, mute, volume, rate, autoplay, listeners = [];
    var task = {url: url, cancel: cancel, promise: new Promise(function (resolve) { resolveTask = resolve; })};
    video.__fyblicSwitch = task;
    function on(node, name, fn) { node.addEventListener(name, fn); listeners.push([node, name, fn]); }
    function clearListeners() { listeners.forEach(function (x) { x[0].removeEventListener(x[1], x[2]); }); listeners = []; }
    function releaseProbe() { try { probe.removeAttribute('src'); probe.load(); } catch (_) {} }
    function finish(ok) {
      if (finished) return; finished = true; clearTimeout(timer); clearListeners(); releaseProbe();
      if (committed) video.autoplay = autoplay;
      if (video.__fyblicSwitch === task) video.__fyblicSwitch = null;
      if (ok && options.onSuccess) options.onSuccess();
      resolveTask(ok);
    }
    function cancel() { finish(false); }
    function resume(ok) {
      if (playing && video.isConnected && (!options.allowed || options.allowed())) {
        video.play().catch(function () {});
      }
      finish(ok);
    }
    function seek() {
      if (!video.isConnected) return finish(false);
      var target = Number.isFinite(video.duration) ? Math.min(keep, Math.max(0, video.duration - 0.01)) : keep;
      try { video.currentTime = target; } catch (_) { return fail(); }
      if (Math.abs(video.currentTime - target) < 0.04 && !video.seeking && video.readyState >= 2) resume(!restoring);
    }
    function fail() {
      if (!committed || restoring || !video.isConnected) return finish(false);
      restoring = true; clearTimeout(timer); clearListeners();
      on(video, 'loadedmetadata', seek);
      on(video, 'seeked', function () { resume(false); });
      on(video, 'canplay', function () { if (!video.seeking) resume(false); });
      on(video, 'error', function () { finish(false); });
      video.src = old; video.dataset.src = old; video.load();
      timer = setTimeout(function () { finish(false); }, 15000);
    }
    function commit() {
      if (committed || finished) return;
      if (!video.isConnected || (options.allowed && !options.allowed())) return finish(false);
      committed = true; task.committed = true; clearListeners(); releaseProbe(); clearTimeout(timer);
      keep = Number(video.currentTime) || 0; playing = options.resume == null ? !video.paused : options.resume; task.wasPlaying = playing;
      mute = video.muted; volume = video.volume; rate = video.playbackRate;
      autoplay = video.autoplay; video.autoplay = false;
      video.pause();
      on(video, 'loadedmetadata', seek);
      on(video, 'seeked', function () { if (video.readyState >= 2) resume(true); });
      on(video, 'canplay', function () { if (!video.seeking && Math.abs(video.currentTime - keep) < 0.1) resume(true); });
      on(video, 'error', fail);
      video.src = url; video.dataset.src = url; video.dataset.happyadLoadOnce = '';
      video.muted = mute; video.volume = volume; video.playbackRate = rate; video.load();
      timer = setTimeout(fail, 20000);
    }
    probe.muted = true; probe.preload = 'auto'; probe.playsInline = true;
    on(probe, 'loadeddata', commit); on(probe, 'error', fail);
    timer = setTimeout(fail, 20000); probe.src = url; probe.load();
    return task.promise;
  }
  window.FyblicVideoSwitchV1125 = {switchSource: switchSource};
})();
