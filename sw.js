// Service Worker for PWA support
// 为了支持 iOS 18 PWA 功能而创建的 Service Worker

self.addEventListener('install', function(event) {
  console.log('Service Worker installing.');
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating.');
});

self.addEventListener('fetch', function(event) {
  // 基本的 fetch 处理
  event.respondWith(fetch(event.request));
});
