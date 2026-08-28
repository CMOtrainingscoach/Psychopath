/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: ({ request, url }) =>
        request.method === "GET" &&
        (url.pathname === "/api/courses" || url.pathname.startsWith("/api/courses/")),
      handler: "NetworkFirst",
      options: {
        cacheName: "psychpath-courses",
        networkTimeoutSeconds: 8,
        expiration: {
          maxEntries: 48,
          maxAgeSeconds: 60 * 60 * 24 * 14,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      matcher: ({ request, url }) =>
        request.method === "GET" && url.pathname === "/api/me",
      handler: "NetworkFirst",
      options: {
        cacheName: "psychpath-profile",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 60 * 60 * 24,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
