import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client;
let isConnected = false;
const onConnectQueue = [];

function getWsUrl() {
  return import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";
}

function ensureClient() {
  if (client) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(getWsUrl()),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
  });

  client.onConnect = () => {
    isConnected = true;
    while (onConnectQueue.length) {
      const fn = onConnectQueue.shift();
      try {
        fn();
      } catch {
        // ignore one faulty subscriber callback
      }
    }
  };

  client.onWebSocketClose = () => {
    isConnected = false;
  };

  client.onStompError = () => {
    // ignore and let reconnect logic handle
  };

  client.activate();
  return client;
}

function parsePayload(body) {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return { raw: body };
  }
}

export function subscribeRealtime(destination, handler) {
  const stompClient = ensureClient();
  let subscription;
  let unsubscribed = false;

  const doSubscribe = () => {
    if (unsubscribed || !stompClient.connected) return;
    subscription = stompClient.subscribe(destination, (message) => {
      handler(parsePayload(message.body));
    });
  };

  if (isConnected && stompClient.connected) {
    doSubscribe();
  } else {
    onConnectQueue.push(doSubscribe);
  }

  return () => {
    unsubscribed = true;
    if (subscription) {
      subscription.unsubscribe();
    }
  };
}
