self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
});

self.addEventListener('fetch', (event) => {
    // A simple no-op fetch handler is sufficient to meet PWA requirements
    // for the "Add to Home Screen" prompt on Android.
});
