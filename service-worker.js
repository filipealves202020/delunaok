const CACHE_NAME = 'deluna-v1';
const urlsToCache = [
  './',
  './index.html',
  './IMG_20250816_204625.jpg', // Adicione o caminho da sua imagem
  // Se tiver outros arquivos (CSS, JS), adicione-os aqui
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta as requisições de rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o arquivo estiver no cache, retorna a versão em cache
        if (response) {
          return response;
        }
        // Se não estiver, busca na rede
        return fetch(event.request);
      })
      .catch(() => {
        // Retorna uma página offline caso a requisição falhe e não haja cache
        // Você pode criar uma página offline específica, por exemplo.
        // Neste exemplo, ele simplesmente não fará nada, mas você pode
        // adicionar uma lógica mais robusta.
        console.log('Requisição de rede falhou e não há cache.');
      })
  );
});

// Ativação do Service Worker para limpar caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
