/* =========================================================
   Frontend Forge — Service Worker

   Caches the app shell so the website can still load
   when the internet connection is unstable.

   IMPORTANT:
   Code execution APIs are NEVER cached.
   ========================================================= */


const CACHE_NAME = 'frontend-forge-v2';


/* =========================================================
   Files to cache
   ========================================================= */

const CORE_ASSETS = [

  'index.html',

  'html-course.html',

  'css-course.html',

  'js-course.html',

  'style.css',

  'script.js',

  'course.js',

  'background.js',

  'manifest.json',

  'icon-192.png',

  'icon-512.png'

];


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(cache => {

          return cache.addAll(
            CORE_ASSETS
          );

        })
        .catch(() => {})

    );

    self.skipWaiting();

  }
);


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(keys => {

          return Promise.all(

            keys

              .filter(
                key => key !== CACHE_NAME
              )

              .map(
                key => caches.delete(key)
              )

          );

        })

    );

    self.clients.claim();

  }
);


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener(
  'fetch',
  event => {

    const request =
      event.request;


    /* Only GET requests */

    if (
      request.method !== 'GET'
    ) {

      return;

    }


    const url =
      request.url;


    /* =====================================================
       NEVER CACHE EXTERNAL SERVICES
       ===================================================== */

    if (

      url.includes(
        'wandbox.org'
      ) ||

      url.includes(
        'emkc.org'
      ) ||

      url.includes(
        'cdnjs.cloudflare.com'
      ) ||

      url.includes(
        'fonts.googleapis.com'
      ) ||

      url.includes(
        'fonts.gstatic.com'
      )

    ) {

      return;

    }


    /* =====================================================
       CACHE FIRST + NETWORK UPDATE
       ===================================================== */

    event.respondWith(

      caches
        .match(request)
        .then(cachedResponse => {

          const networkResponse =
            fetch(request)

              .then(response => {

                if (
                  response &&
                  response.ok
                ) {

                  const copy =
                    response.clone();

                  caches
                    .open(CACHE_NAME)
                    .then(cache => {

                      cache.put(
                        request,
                        copy
                      );

                    });

                }

                return response;

              })

              .catch(() => {

                return cachedResponse;

              });


          return (
            cachedResponse ||
            networkResponse
          );

        })

    );

  }
);