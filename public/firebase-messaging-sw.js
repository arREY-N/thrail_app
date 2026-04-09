importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Forces the waiting service worker to become the active one
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim()); // Allows the worker to start controlling the page immediately
});


firebase.initializeApp({
  apiKey: "AIzaSyC4AE3VabeLkAWHmLbZ10oR4LWY69jkx5Y",
  projectId: "thrail",
  messagingSenderId: "672035725620",
  appId: "1:672035725620:web:ffa5e8f734a2b492e78561",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background Message received: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});