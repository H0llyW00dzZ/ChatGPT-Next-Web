import { useState, useEffect, useCallback } from "react";
import { useChatStore, useAppConfig } from "../store";
import Locale from "../locales";
import { showToast } from "./ui-lib";
import { getClientConfig } from "../config/client";
import { appWindow } from '@tauri-apps/api/window';
import { sendDesktopNotification } from "../utils/taurinotification";

export function usePinApp(sessionId: string) {
  const [pinApp, setPinApp] = useState(false);
  const isApp = getClientConfig()?.isApp;
  const config = useAppConfig();
  const TauriShortcut = config.desktopShortcut;
  const chatStore = useChatStore();
  const session = chatStore.currentSession();

  const togglePinApp = useCallback(async () => {
    if (!isApp) {
      return;
    }

    if (pinApp) {
      await appWindow.setAlwaysOnTop(false);
      sendDesktopNotification(Locale.Chat.Actions.PinAppContent.UnPinned);
      showToast(Locale.Chat.Actions.PinAppContent.UnPinned);
    } else {
      await appWindow.setAlwaysOnTop(true);
      sendDesktopNotification(Locale.Chat.Actions.PinAppContent.Pinned);
      showToast(Locale.Chat.Actions.PinAppContent.Pinned);
    }
    setPinApp((prevPinApp) => !prevPinApp);
  }, [isApp, pinApp]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === TauriShortcut) {
        togglePinApp();
      }
    };
    // Usage : Mouse+5,Mouse+4,Mouse+1(Middle Click)
    // You need to copy-paste (e.g., Mouse+5 paste in settings) instead of typing manually in settings
    const handleMouseClick = (event: MouseEvent) => {
      if (event.button === 1 || event.button === 4 || event.button === 5) {
        togglePinApp();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    document.addEventListener("mousedown", handleMouseClick);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("mousedown", handleMouseClick);
    };
  }, [TauriShortcut, togglePinApp]);
  // Reset pinApp when the session changes
  useEffect(() => {
    setPinApp(false);
  }, [sessionId]); // Listen for changes to sessionId

  return {
    pinApp: isApp ? pinApp : false,
    togglePinApp: isApp ? togglePinApp : () => { },
  };
}
