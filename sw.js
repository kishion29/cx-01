// 星言 Service Worker - 离线缓存支持
// ★ 版本号随应用更新：每次部署改这里（与 27_pwa.js 的 APP_VERSION 对应），
// 强制浏览器重新安装 SW 并清理旧缓存，避免一直用旧缓存导致 PWA 异常
var CACHE_NAME = 'xingyan-v1.7.6';
var CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// 安装: 预缓存核心资源
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // 核心资源缓存失败不阻塞安装
      return Promise.allSettled(
        CORE_ASSETS.map(function(url) {
          return cache.add(url);
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 激活: 清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 请求拦截: 导航请求网络优先(在线必用最新版), 其余同源资源缓存优先
self.addEventListener('fetch', function(event) {
  var request = event.request;
  // 仅处理 GET 请求
  if (request.method !== 'GET') return;

  var url = new URL(request.url);
  // 跨域请求: 直接走网络
  if (url.origin !== self.location.origin) return;

  // ★ 导航请求(打开/刷新页面): 网络优先
  // 在线时总是返回服务器最新 HTML，避免一直用旧缓存导致"不同设备版本不一致"；
  // 只有离线时才回退本地缓存
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(function() {
        return caches.match(request, { ignoreSearch: true }).then(function(r) {
          return r || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // 其余同源请求: 缓存优先, 后台更新
  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) {
        // 后台更新缓存
        fetch(request).then(function(resp) {
          if (resp && resp.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(request, resp.clone());
            });
          }
        }).catch(function() {});
        return cached;
      }
      // 无缓存: 从网络获取
      return fetch(request).then(function(resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, clone);
          });
        }
        return resp;
      }).catch(function() {
        // 非导航请求离线且无缓存: 直接失败(导航已由上面分支兜底)
      });
    })
  );
});

// 消息: 接收前端刷新指令 + 通知显示
self.addEventListener('message', function(event) {
  var data = event.data;
  if (!data) return;
  if (data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (data === 'clearCache') {
    caches.delete(CACHE_NAME).then(function() {
      event.source && event.source.postMessage && event.source.postMessage('cacheCleared');
    });
  }
  // ★ 修复：处理 SHOW_NOTIFICATION 消息——此前只收消息不显示，
  // 页面端 postMessage 后直接 return 导致通知被吞（手机端后台弹窗失效的回归根因）
  if (data && data.type === 'SHOW_NOTIFICATION') {
    try {
      var opts = { body: data.body || '', renotify: true };
      if (data.icon) { opts.icon = data.icon; opts.badge = data.icon; }
      if (data.tag) { opts.tag = data.tag; }
      self.registration.showNotification(data.title || '星言', opts);
    } catch (e) {}
  }
});
