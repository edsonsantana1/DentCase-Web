const CACHE_NAME = 'odonto-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon/192.png',
  '/icon/512.png',
  '/icon/144.png'
];

// Instalação do Service Worker e adição dos arquivos ao cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto e arquivos adicionados');
        return cache.addAll(urlsToCache);
      })
      .catch(error => console.error('Erro ao abrir o cache: ', error))  // Tratamento de erro
  );
});

// Ativação do Service Worker - Limpeza de caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // Manter apenas o cache atual
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            // Deleta caches antigos
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Retorna do cache
          return response;
        }
       
        return fetch(event.request).catch(error => {
          console.error('Erro no fetch da requisição: ', error);
          throw error;
        });
      })
  );
});
