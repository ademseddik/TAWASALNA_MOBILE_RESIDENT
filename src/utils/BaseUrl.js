
export const APP_ENV = {
    AUTH_PORT: "http://192.168.148.112:8070",
    SOCIAL_PORT: "http://192.168.148.112:8093",
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
  