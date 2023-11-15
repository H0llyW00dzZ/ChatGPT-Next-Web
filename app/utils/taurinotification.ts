import { getClientConfig } from "../config/client";
import ChatGptIcon from "../icons/chatgpt.png";

export async function sendDesktopNotification(body: string) {
  const isApp = getClientConfig();

  if (window.__TAURI__?.notification && isApp) {
    // Check if notification permission is granted
    await window.__TAURI__?.notification.
          isPermissionGranted().then((granted) => {
      if (!granted) {
        return;
      } else {
        // Request permission to show notifications
        window.__TAURI__?.notification.
        requestPermission().then((permission) => {
          if (permission === 'granted') {
            // Show a notification using Tauri
            window.__TAURI__?.notification.sendNotification({
              title: "ChatGPT Next Web",
              body: body,
              icon: `${ChatGptIcon.src}`,
              sound: "Default"
            });
          }
        });
      }
    });
  }
}
