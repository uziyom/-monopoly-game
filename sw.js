// sw.js — 方块地产 PWA Service Worker
// 仅做轻量的"外壳缓存"：缓存 index.html 本身，方便弱网/离线时仍能打开App
// 游戏数据通过 WebSocket 实时同步，不在此处缓存（缓存了也没意义，数据会过期）

const CACHE_NAME = "monopoly-shell-v1";
const SHELL_FILES = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // 只处理同源 GET 请求；WebSocket 升级请求和跨域 API 请求直接放过，不拦截
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  event.respondWith(
    fetch(req)
      .then((resp) => {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req))
  );
});
