
const IP_ADDRESS = `192.168.1.13`;

export const APP_ENV = {
  BUSINESS_PORT: `http://157.173.196.161:31195/tawasalna-business`,
  AUTH_PORT: "http://157.173.196.161:30265",
  SOCIAL_PORT: "http://157.173.196.161:31499",
  EXPO_PUBLIC_ADMIN_SOCKET: "ws://157.173.196.161:31499/tawasalna-community/ws",
  WS_URL: "http://157.173.196.161:31499/tawasalna-community/ws",
  NOTIFICATION_WS_URL: "ws://157.173.196.161:31499/tawasalna-community/ws-notif",
  // IP_ADDRESS,
  // AUTH_PORT: `http://${IP_ADDRESS}:8070`,
  // SOCIAL_PORT: `http://${IP_ADDRESS}:8093`,
  // BUSINESS_PORT: `http://${IP_ADDRESS}:8071/tawasalna-business`,
  // EXPO_PUBLIC_ADMIN_SOCKET: `ws://${IP_ADDRESS}:8093/tawasalna-community/ws`,
  // WS_URL: `http://${IP_ADDRESS}:8093/tawasalna-community/ws`,
  // NOTIFICATION_WS_URL: `ws://${IP_ADDRESS}:8093/tawasalna-community/ws-notif`,
  HOST: process.env.EXPO_PUBLIC_HOST,
};

console.log("APP_ENV", APP_ENV);

export default function BASE_URL(host, port) {
  if (host.startsWith("https") || host.startsWith("http")) {
    // For production testing
    return `${host}`;
  } else {
    // For local testing
    return `http://${host}:${port}`;
  }
}

export const SOCKET_URL = (host, namespace = "", port, queryParams = "") => {
  if (host.startsWith("https")) {
    // For production testing
    return `${host}/${namespace}${queryParams}`;
  } else {
    // For local testing
    return `ws://${host}:${port}/${namespace}${queryParams}`;
  }
};
  