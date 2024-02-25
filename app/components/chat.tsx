import { useDebouncedCallback } from "use-debounce";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
} from "react";

import SendWhiteIcon from "../icons/send-white.svg";
import BrainIcon from "../icons/brain.svg";
import RenameIcon from "../icons/rename.svg";
import ExportIcon from "../icons/share.svg";
import ReturnIcon from "../icons/return.svg";
import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
import LoadingButtonIcon from "../icons/loading.svg";
import PromptIcon from "../icons/prompt.svg";
import MaskIcon from "../icons/mask.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ResetIcon from "../icons/reload.svg";
import BreakIcon from "../icons/break.svg";
import SettingsIcon from "../icons/chat-settings.svg";
import DeleteIcon from "../icons/clear.svg";
import PinIcon from "../icons/pin.svg";
import EditIcon from "../icons/rename.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";
import DownloadIcon from "../icons/download.svg";
import UploadIcon from "../icons/upload.svg";
import ImageIcon from "../icons/image.svg";

import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import BottomIcon from "../icons/bottom.svg";
import StopIcon from "../icons/pause.svg";
import RobotIcon from "../icons/robot.svg";
import ChatGptIcon from "../icons/chatgpt.png";
import EyeOnIcon from "../icons/eye.svg";
import EyeOffIcon from "../icons/eye-off.svg";
import { debounce, escapeRegExp } from "lodash";
import CloseIcon from "../icons/close.svg";

import {
  ChatMessage,
  SubmitKey,
  useChatStore,
  BOT_HELLO,
  createMessage,
  useAccessStore,
  Theme,
  useAppConfig,
  DEFAULT_TOPIC,
  ModelType,
} from "../store";

import {
  copyToClipboard,
  selectOrCopy,
  autoGrowTextArea,
  useMobileScreen,
  downloadAs,
  readFromFile,
  getMessageTextContent,
  getMessageImages,
  isVisionModel,
  compressImage,
} from "../utils";

import dynamic from "next/dynamic";

import { ChatControllerPool } from "../client/controller";
import { Prompt, usePromptStore } from "../store/prompt";
import Locale from "../locales";

import { IconButton } from "./button";
import styles from "./chat.module.scss";

import {
  List,
  ListItem,
  Modal,
  Selector,
  showConfirm,
  showPrompt,
  showToast,
} from "./ui-lib";
import { useNavigate } from "react-router-dom";
import {
  CHAT_PAGE_SIZE,
  LAST_INPUT_KEY,
  Path,
  REQUEST_TIMEOUT_MS,
  UNFINISHED_INPUT,
} from "../constant";
import { Avatar } from "./emoji";
import { ContextPrompts, MaskAvatar, MaskConfig } from "./mask";
import { useMaskStore } from "../store/mask";
import { ChatCommandPrefix, useChatCommand, useCommand } from "../command";
import { prettyObject } from "../utils/format";
import { ExportMessageModal } from "./exporter";
import { getClientConfig } from "../config/client";
import { useAllModels } from "../utils/hooks";
import { appWindow } from '@tauri-apps/api/window';
import { sendDesktopNotification } from "../utils/taurinotification";
import { clearUnfinishedInputForSession, debouncedSave } from "../utils/storageHelper";
import { MultimodalContent } from "../client/api";
import Image from 'next/image';


const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

export function SessionConfigModel(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const maskStore = useMaskStore();
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const isApp = !!getClientConfig()?.isApp;
  const isMobileScreen = useMobileScreen();

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    const currentDate = new Date();
    const currentSession = chatStore.currentSession();
    const messageCount = currentSession.messages.length;
    const datePart = isApp
      ? `${currentDate.toLocaleDateString().replace(/\//g, '_')} ${currentDate.toLocaleTimeString().replace(/:/g, '_')}`
      : `${currentDate.toLocaleString().replace(/:/g, '_')}`;
  
    const formattedMessageCount = Locale.ChatItem.ChatItemCount(messageCount); // Format the message count using the translation function
    const fileName = `${session.topic}-(${formattedMessageCount})-${datePart}.json`;
    await downloadAs(session, fileName);
    setExporting(false);
  };

  const importchat = async () => {
    await readFromFile().then((content) => {
      try {
        const importedData = JSON.parse(content);
        chatStore.updateCurrentSession((session) => {
          Object.assign(session, importedData);
        });
      } catch (e) {
        console.error("[Import] Failed to import JSON file:", e);
        showToast(Locale.Settings.Sync.ImportFailed);
      }
    });
  };

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Context.Edit}
        onClose={() => props.onClose()}
        actions={[
          /**
           * Currently disabled in mobile for export/import
           **/
          !isMobileScreen && (
            <IconButton
              key="export"
              icon={<DownloadIcon />}
              bordered
              text={Locale.UI.Export}
              onClick={handleExport}
              disabled={exporting}
            />
          ),
          !isMobileScreen && (
            <IconButton
              key="import"
              icon={<UploadIcon />}
              bordered
              text={Locale.UI.Import}
              onClick={importchat}
            />
          ),
          <IconButton
            key="reset"
            icon={<ResetIcon />}
            bordered
            text={Locale.Chat.Config.Reset}
            onClick={async () => {
              if (await showConfirm(Locale.Memory.ResetConfirm)) {
                chatStore.updateCurrentSession(
                  (session) => (session.memoryPrompt = ""),
                );
              }
            }}
          />,
          <IconButton
            key="copy"
            icon={<CopyIcon />}
            bordered
            text={Locale.Chat.Config.SaveAs}
            onClick={() => {
              navigate(Path.Masks);
              setTimeout(() => {
                maskStore.create(session.mask);
              }, 500);
            }}
          />,
        ]}
      >
        <MaskConfig
          mask={session.mask}
          updateMask={(updater) => {
            const mask = { ...session.mask };
            updater(mask);
            chatStore.updateCurrentSession((session) => (session.mask = mask));
          }}
          shouldSyncFromGlobal
          extraListItems={
            session.mask.modelConfig.sendMemory ? (
              <ListItem
                className="copyable"
                title={`${Locale.Memory.Title} (${session.lastSummarizeIndex} of ${session.messages.length})`}
                subTitle={session.memoryPrompt || Locale.Memory.EmptyContent}
              ></ListItem>
            ) : (
              <></>
            )
          }
        ></MaskConfig>
      </Modal>
    </div>
  );
}

function PromptToast(props: {
  showToast?: boolean;
  showModal?: boolean;
  setShowModal: (_: boolean) => void;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const context = session.mask.context;

  return (
    <div className={styles["prompt-toast"]} key="prompt-toast">
      {props.showToast && (
        <div
          className={styles["prompt-toast-inner"] + " clickable"}
          role="button"
          onClick={() => props.setShowModal(true)}
        >
          <BrainIcon />
          <span className={styles["prompt-toast-content"]}>
            {Locale.Context.Toast(context.length)}
          </span>
        </div>
      )}
      {props.showModal && (
        <SessionConfigModel onClose={() => props.setShowModal(false)} />
      )}
    </div>
  );
}

function useSubmitHandler() {
  const config = useAppConfig();
  const submitKey = config.submitKey;
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener("compositionstart", onCompositionStart);
    window.addEventListener("compositionend", onCompositionEnd);

    return () => {
      window.removeEventListener("compositionstart", onCompositionStart);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
      return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

export type RenderPompt = Pick<Prompt, "title" | "content">;

export function PromptHints(props: {
  prompts: RenderPompt[];
  onPromptSelect: (prompt: RenderPompt) => void;
}) {
  const noPrompts = props.prompts.length === 0;
  const [selectIndex, setSelectIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectIndex(0);
  }, [props.prompts.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (noPrompts || e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      // arrow up / down to select prompt
      const changeIndex = (delta: number) => {
        e.stopPropagation();
        e.preventDefault();
        const nextIndex = Math.max(
          0,
          Math.min(props.prompts.length - 1, selectIndex + delta),
        );
        setSelectIndex(nextIndex);
        selectedRef.current?.scrollIntoView({
          block: "center",
        });
      };

      if (e.key === "ArrowUp") {
        changeIndex(1);
      } else if (e.key === "ArrowDown") {
        changeIndex(-1);
      } else if (e.key === "Enter") {
        const selectedPrompt = props.prompts.at(selectIndex);
        if (selectedPrompt) {
          props.onPromptSelect(selectedPrompt);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.prompts.length, selectIndex]);

  if (noPrompts) return null;
  return (
    <div className={styles["prompt-hints"]}>
      {props.prompts.map((prompt, i) => (
        <div
          ref={i === selectIndex ? selectedRef : null}
          className={
            styles["prompt-hint"] +
            ` ${i === selectIndex ? styles["prompt-hint-selected"] : ""}`
          }
          key={prompt.title + i.toString()}
          onClick={() => props.onPromptSelect(prompt)}
          onMouseEnter={() => setSelectIndex(i)}
        >
          <div className={styles["hint-title"]}>{prompt.title}</div>
          <div className={styles["hint-content"]}>{prompt.content}</div>
        </div>
      ))}
    </div>
  );
}

function ClearContextDivider() {
  const chatStore = useChatStore();

  return (
    <div
      className={styles["clear-context"]}
      onClick={() =>
        chatStore.updateCurrentSession(
          (session) => (session.clearContextIndex = undefined),
        )
      }
    >
      <div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div>
      <div className={styles["clear-context-revert-btn"]}>
        {Locale.Context.Revert}
      </div>
    </div>
  );
}

function ChatAction(props: {
  text: string;
  icon: JSX.Element;
  onClick: () => void;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState({
    full: 16,
    icon: 16,
  });

  function updateWidth() {
    if (!iconRef.current || !textRef.current) return;
    const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
    const textWidth = getWidth(textRef.current);
    const iconWidth = getWidth(iconRef.current);
    setWidth({
      full: textWidth + iconWidth,
      icon: iconWidth,
    });
  }

  return (
    <div
      className={`${styles["chat-input-action"]} clickable`}
      onClick={() => {
        props.onClick();
        setTimeout(updateWidth, 1);
      }}
      onMouseEnter={updateWidth}
      onTouchStart={updateWidth}
      style={
        {
          "--icon-width": `${width.icon}px`,
          "--full-width": `${width.full}px`,
        } as React.CSSProperties
      }
    >
      <div ref={iconRef} className={styles["icon"]}>
        {props.icon}
      </div>
      <div className={styles["text"]} ref={textRef}>
        {props.text}
      </div>
    </div>
  );
}

function useScrollToBottom() {
  // for auto-scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const userHasScrolledUp = useRef(false);

  function onScroll() {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight;

    userHasScrolledUp.current = !isAtBottom;
  }

  function scrollDomToBottom() {
    const dom = scrollRef.current;
    if (dom && !userHasScrolledUp.current) {
      dom.scrollTop = dom.scrollHeight;
    }
  }

  const scrollToBottomSmooth = () => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      const scrollHeight = scrollContainer.scrollHeight;
      const height = scrollContainer.clientHeight;
      const maxScrollTop = scrollHeight - height;
      scrollContainer.scrollTo({ top: maxScrollTop, behavior: 'smooth' });
    }
  };

  // auto scroll
  useEffect(() => {
    if (autoScroll) {
      scrollDomToBottom();
    }
    const dom = scrollRef.current;
    dom?.addEventListener("scroll", onScroll);

    scrollDomToBottom();

    return () => {
      dom?.removeEventListener("scroll", onScroll);
    };
  });

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollDomToBottom,
    scrollToBottomSmooth,
  };
}

export function ChatActions(props: {
  uploadImage: () => void;
  setAttachImages: (images: string[]) => void;
  setUploading: (uploading: boolean) => void;
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
  showContextPrompts: boolean;
  toggleContextPrompts: () => void;
  uploading: boolean;
  attachImages: string[];
}) {
  const config = useAppConfig();
  const navigate = useNavigate();
  const chatStore = useChatStore();

  // switch themes
  const theme = config.theme;
  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }

  // stop all responses
  const couldStop = ChatControllerPool.hasPending();
  const stopAll = () => ChatControllerPool.stopAll();

  // switch model
  const currentModel = chatStore.currentSession().mask.modelConfig.model;
  const allModels = useAllModels();
  const models = useMemo(
    () => allModels.filter((m) => m.available),
    [allModels],
  );
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showUploadImage, setShowUploadImage] = useState(false);

  // this fix memory leak as well, idk why front-end it's so fucking difficult to maintain cause of stupid complex
  // for front-end developer you literally fucking retarded, write a complex code
  useEffect(() => {
    const show = isVisionModel(currentModel);
    if (showUploadImage !== show) {
      setShowUploadImage(show);
    }

    if (!show) {
      // Check if there's really a need to update these states to prevent unnecessary re-renders
      if (props.uploading) {
        props.setUploading(false);
      }
      if (props.attachImages.length !== 0) {
        props.setAttachImages([]);
      }
    }

    // if current model is not available
    // switch to first available model
    const isUnavailableModel = !models.some((m) => m.name === currentModel);
    if (isUnavailableModel && models.length > 0) {
      const nextModel = models[0].name as ModelType;
      // Only update if the next model is different from the current model
      if (currentModel !== nextModel) {
        chatStore.updateCurrentSession(
          (session) => (session.mask.modelConfig.model = nextModel),
        );
        showToast(nextModel);
      }
    }
  }, [props, chatStore, currentModel, models, showUploadImage]);

  return (
    <div className={styles["chat-input-actions"]}>
      {couldStop && (
        <ChatAction
          onClick={stopAll}
          text={Locale.Chat.InputActions.Stop}
          icon={<StopIcon />}
        />
      )}
      {!props.hitBottom && (
        <ChatAction
          onClick={props.scrollToBottom}
          text={Locale.Chat.InputActions.ToBottom}
          icon={<BottomIcon />}
        />
      )}
      {props.hitBottom && (
        <ChatAction
          onClick={props.showPromptModal}
          text={Locale.Chat.InputActions.Settings}
          icon={<SettingsIcon />}
        />
      )}

      {showUploadImage && (
        <ChatAction
          onClick={props.uploadImage}
          text={Locale.Chat.InputActions.UploadImage}
          icon={props.uploading ? <LoadingButtonIcon /> : <ImageIcon />}
        />
      )}
      <ChatAction
        onClick={nextTheme}
        text={Locale.Chat.InputActions.Theme[theme]}
        icon={
          <>
            {theme === Theme.Auto ? (
              <AutoIcon />
            ) : theme === Theme.Light ? (
              <LightIcon />
            ) : theme === Theme.Dark ? (
              <DarkIcon />
            ) : null}
          </>
        }
      />

      <ChatAction
        onClick={props.showPromptHints}
        text={Locale.Chat.InputActions.Prompt}
        icon={<PromptIcon />}
      />

      <ChatAction
        onClick={props.toggleContextPrompts}
        text={
          props.showContextPrompts
            ? Locale.Mask.Config.ShowFullChatHistory.UnHide
            : Locale.Mask.Config.ShowFullChatHistory.Hide
        }
        icon={
          props.showContextPrompts ? (
            <EyeOffIcon />
          ) : (
            <EyeOnIcon />
          )
        }
      />

      <ChatAction
        onClick={() => {
          navigate(Path.Masks);
        }}
        text={Locale.Chat.InputActions.Masks}
        icon={<MaskIcon />}
      />

      <ChatAction
        text={Locale.Chat.InputActions.Clear}
        icon={<BreakIcon />}
        onClick={() => {
          chatStore.updateCurrentSession((session) => {
            if (session.clearContextIndex === session.messages.length) {
              session.clearContextIndex = undefined;
            } else {
              session.clearContextIndex = session.messages.length;
              session.memoryPrompt = ""; // will clear memory
            }
          });
        }}
      />

      <ChatAction
        onClick={() => setShowModelSelector(true)}
        text={currentModel}
        icon={<RobotIcon />}
      />

      {showModelSelector && (
        <Selector
          defaultSelectedValue={currentModel}
          items={models.map((m) => ({
            title: m.displayName,
            value: m.name,
          }))}
          onClose={() => setShowModelSelector(false)}
          onSelection={(s) => {
            if (s.length === 0) return;
            chatStore.updateCurrentSession((session) => {
              session.mask.modelConfig.model = s[0] as ModelType;
              session.mask.syncGlobalConfig = false;
            });
            showToast(s[0]);
          }}
        />
      )}
    </div>
  );
}

export function EditMessageModal(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const [messages, setMessages] = useState(session.messages.slice());

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Chat.EditMessage.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            text={Locale.UI.Cancel}
            icon={<CancelIcon />}
            key="cancel"
            onClick={() => {
              props.onClose();
            }}
          />,
          <IconButton
            type="primary"
            text={Locale.UI.Confirm}
            icon={<ConfirmIcon />}
            key="ok"
            onClick={() => {
              chatStore.updateCurrentSession(
                (session) => (session.messages = messages),
              );
              props.onClose();
            }}
          />,
        ]}
      >
        <List>
          <ListItem
            title={Locale.Chat.EditMessage.Topic.Title}
            subTitle={Locale.Chat.EditMessage.Topic.SubTitle}
          >
            <input
              type="text"
              value={session.topic}
              onInput={(e) =>
                chatStore.updateCurrentSession(
                  (session) => (session.topic = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </List>
        <ContextPrompts
          context={messages}
          updateContext={(updater) => {
            const newMessages = messages.slice();
            updater(newMessages);
            setMessages(newMessages);
          }}
        />
      </Modal>
    </div>
  );
}

function usePinApp(sessionId: string) { // Accept sessionId as a parameter
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

// Custom hook for debouncing a function
function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  // Include `effect` in the dependency array for `useCallback`
  const callback = useCallback(effect, [effect, ...deps]);

  useEffect(() => {
    const handler = debounce(callback, delay);

    handler();

    // Cleanup function to cancel the debounced call if the component unmounts
    return () => handler.cancel();
  }, [callback, delay]); // `callback` already includes `effect` in its dependencies, so no need to add it here again.
}

export function DeleteImageButton(props: { deleteImage: () => void }) {
  return (
    <div
      className={styles["delete-image"]}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.deleteImage();
      }}
    >
      <DeleteIcon />
    </div>
  );
}

export function ImageBox(props: {
  showImageBox: boolean;
  data: { src: string; alt: string };
  closeImageBox: () => void;
}) {
  return (
    <div
      className={styles["image-box"]}
      style={{ display: props.showImageBox ? "block" : "none" }}
      onClick={props.closeImageBox}
    >
      <img src={props.data.src} alt={props.data.alt} />
      <div className={styles["image-box-close-button"]}>
        <CloseIcon />
      </div>
    </div>
  );
}

function _Chat() {
  type RenderMessage = ChatMessage & { preview?: boolean };

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const fontSize = config.fontSize;

  const [showExport, setShowExport] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();
  const [hitBottom, setHitBottom] = useState(true);
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();
  const { pinApp, togglePinApp } = usePinApp(session.id);
  const isApp = getClientConfig()?.isApp;
  const [attachImages, setAttachImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showImageBox, setShowImageBox] = useState(false);
  const [imageBoxData, setImageBoxData] = useState({ src: "", alt: "" });

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<RenderPompt[]>([]);
  const onSearch = useDebouncedCallback(
    (text: string) => {
      const matchedPrompts = promptStore.search(text);
      setPromptHints(matchedPrompts);
    },
    100,
    { leading: true, trailing: true },
  );

  // auto grow input
  const [inputRows, setInputRows] = useState(2);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        20,
        Math.max(2 + Number(!isMobileScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, [userInput]);

  const loadchat = () => {
    readFromFile().then((content) => {
      try {
        const importedData = JSON.parse(content);
        chatStore.updateCurrentSession((session) => {
          Object.assign(session, importedData);
          // Set any other properties you want to update in the session
        });
      } catch (e) {
        console.error("[Import] Failed to import JSON file:", e);
        showToast(Locale.Settings.Sync.ImportFailed);
      }
    });
  };
  
  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => chatStore.newSession(),
    newm: () => navigate(Path.NewChat),
    prev: () => chatStore.nextSession(-1),
    next: () => chatStore.nextSession(1),
    restart: () => window.__TAURI__?.process.relaunch(),
    clear: () =>
      chatStore.updateCurrentSession(
        (session) => (session.clearContextIndex = session.messages.length),
      ),
    del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
    save: () =>
      downloadAs((session), `${session.topic}.json`),
    load: loadchat,
    copymemoryai: () => {
      const memoryPrompt = chatStore.currentSession().memoryPrompt;
      if (memoryPrompt.trim() !== "") {
        copyToClipboard(memoryPrompt);
        showToast(Locale.Copy.Success);
      } else {
        showToast(Locale.Copy.Failed);
      }
    },
    updatemasks: () => {
      chatStore.updateCurrentSession((session) => {
        const memoryPrompt = session.memoryPrompt;
        const currentDate = new Date().toLocaleString(); // Get the current date and time as a string
        const existingContext = session.mask.context;
        let currentContext = existingContext[0]; // Get the current context message
    
        if (!currentContext || currentContext.role !== "system") {
          // If the current context message doesn't exist or doesn't have the role "system"
          currentContext = {
            role: "system",
            content: memoryPrompt,
            date: currentDate,
            id: "", // Generate or set the ID for the new message
            // Add any other properties you want to set for the context messages
          };
          existingContext.unshift(currentContext); // Add the new message at the beginning of the context array
          showToast(Locale.Chat.Commands.UI.MasksSuccess);
        } else {
          // If the current context message already exists and has the role "system"
          currentContext.content = memoryPrompt; // Update the content
          currentContext.date = currentDate; // Update the date
          // You can update other properties of the current context message here
        }
    
        // Set any other properties you want to update in the session
        session.mask.context = existingContext;
        showToast(Locale.Chat.Commands.UI.MasksSuccess);
      });
    },
  });  

  // only search prompts when user input is short
  const SEARCH_TEXT_LIMIT = 30;
  const onInput = (text: string) => {
    setUserInput(text);
    const n = text.trim().length;

    // clear search results
    if (n === 0) {
      setPromptHints([]);
    } else if (text.startsWith(ChatCommandPrefix)) {
      setPromptHints(chatCommands.search(text));
    } else if (!config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
      // check if need to trigger auto completion
      if (text.startsWith("/")) {
        let searchText = text.slice(1);
        onSearch(searchText);
      }
    }
  };

  const doSubmit = (userInput: string) => {
    if (userInput.trim() === "") return;

    // reduce a zod cve CVE-2023-4316
    const escapedInput = escapeRegExp(userInput);

    const matchCommand = chatCommands.match(escapedInput);

    if (matchCommand.matched) {
      setUserInput("");
      setPromptHints([]);
      matchCommand.invoke();
      return;
    }
    setIsLoading(true);
    chatStore
      .onUserInput(userInput, attachImages)
      .then(() => setIsLoading(false));
    setAttachImages([]);
    setUserInput("");
    setPromptHints([]);
    if (!isMobileScreen) inputRef.current?.focus();
    setAutoScroll(true);
  };

  const onPromptSelect = (prompt: RenderPompt) => {
    setTimeout(() => {
      setPromptHints([]);

      const matchedChatCommand = chatCommands.match(prompt.content);
      if (matchedChatCommand.matched) {
        // if user is selecting a chat command, just trigger it
        matchedChatCommand.invoke();
        setUserInput("");
      } else {
        // or fill the prompt
        setUserInput(prompt.content);
      }
      inputRef.current?.focus();
    }, 30);
  };

  // stop response
  const onUserStop = (messageId: string) => {
    ChatControllerPool.stop(session.id, messageId);
  };

  useEffect(() => {
    chatStore.updateCurrentSession((session) => {
      const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
      session.messages.forEach((m) => {
        // check if should stop all stale messages
        if (m.isError || new Date(m.date).getTime() < stopTiming) {
          if (m.streaming) {
            m.streaming = false;
          }

          if (m.content.length === 0) {
            m.isError = true;
            m.content = prettyObject({
              error: true,
              message: "empty response",
            });
          }
        }
      });

      // auto sync mask config from global config
      if (session.mask.syncGlobalConfig) {
        console.log("[Mask] syncing from global, name = ", session.mask.name);
        session.mask.modelConfig = { ...config.modelConfig };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      setUserInput(localStorage.getItem(LAST_INPUT_KEY) ?? "");
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e) && promptHints.length === 0) {
      doSubmit(userInput);
      e.preventDefault();
    }
  };
  const onRightClick = (e: any, message: ChatMessage) => {
    // copy to clipboard
    if (selectOrCopy(e.currentTarget, getMessageTextContent(message))) {
      if (userInput.length === 0) {
        setUserInput(getMessageTextContent(message));
      }

      e.preventDefault();
    }
  };

  const deleteMessage = (msgId?: string) => {
    chatStore.updateCurrentSession(
      (session) =>
        (session.messages = session.messages.filter((m) => m.id !== msgId)),
    );
  };

  const onDelete = (msgId: string) => {
    deleteMessage(msgId);
  };

  const onResend = (message: ChatMessage) => {
    // when it is resending a message
    // 1. for a user's message, find the next bot response
    // 2. for a bot's message, find the last user's input
    // 3. delete original user input and bot's message
    // 4. resend the user's input

    const resendingIndex = session.messages.findIndex(
      (m) => m.id === message.id,
    );

    if (resendingIndex < 0 || resendingIndex >= session.messages.length) {
      console.error("[Chat] failed to find resending message", message);
      return;
    }

    let userMessage: ChatMessage | undefined;
    let botMessage: ChatMessage | undefined;

    if (message.role === "assistant") {
      // if it is resending a bot's message, find the user input for it
      botMessage = message;
      for (let i = resendingIndex; i >= 0; i -= 1) {
        if (session.messages[i].role === "user") {
          userMessage = session.messages[i];
          break;
        }
      }
    } else if (message.role === "user") {
      // if it is resending a user's input, find the bot's response
      userMessage = message;
      for (let i = resendingIndex; i < session.messages.length; i += 1) {
        if (session.messages[i].role === "assistant") {
          botMessage = session.messages[i];
          break;
        }
      }
    }

    if (userMessage === undefined) {
      console.error("[Chat] failed to resend", message);
      return;
    }

    // delete the original messages
    deleteMessage(userMessage.id);
    deleteMessage(botMessage?.id);

    // resend the message
    setIsLoading(true);
    const textContent = getMessageTextContent(userMessage);
    const images = getMessageImages(userMessage);
    chatStore.onUserInput(textContent, images).then(() => setIsLoading(false));
    inputRef.current?.focus();
  };

  const onPinMessage = (message: ChatMessage) => {
    chatStore.updateCurrentSession((session) =>
      session.mask.context.push(message),
    );

    showToast(Locale.Chat.Actions.PinToastContent, {
      text: Locale.Chat.Actions.PinToastAction,
      onClick: () => {
        setShowPromptModal(true);
      },
    });
  };

  const accessStore = useAccessStore();
  const isAuthorized = accessStore.isAuthorized();
  const context: RenderMessage[] = useMemo(() => {
    const contextMessages = session.mask.hideContext ? [] : session.mask.context.slice();

    if (
      contextMessages.length === 0 &&
      session.messages.at(0)?.role !== "system"
    ) {
      const copiedHello = Object.assign({}, BOT_HELLO);
      if (!isAuthorized) {
        copiedHello.role = "system";
        copiedHello.content = Locale.Error.Unauthorized;
      }
      contextMessages.push(copiedHello);
    }

    return contextMessages;
  }, [session.mask.context, session.mask.hideContext, session.messages, isAuthorized]);

  // preview messages
  const renderMessages = useMemo(() => {
    return context
      .concat(session.messages as RenderMessage[])
      .concat(
        isLoading
          ? [
              {
                ...createMessage({
                  role: "assistant",
                  content: "……",
                }),
                preview: true,
              },
            ]
          : [],
      )
      .concat(
        userInput.length > 0 && config.sendPreviewBubble
          ? [
              {
                ...createMessage({
                  role: "user",
                  content: userInput,
                }),
                preview: true,
              },
            ]
          : [],
      );
  }, [
    config.sendPreviewBubble,
    context,
    isLoading,
    session.messages,
    userInput,
  ]);

  // At the top level of the component
  // this should be fix a stupid react warning that sometimes its fucking incorrect
  const [msgRenderIndex, _setMsgRenderIndex] = useState<number>(
    Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );
  const setMsgRenderIndex = useCallback((newIndex: number) => {
    newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }, [renderMessages.length, _setMsgRenderIndex]);

  const messages = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      renderMessages.length,
    );
    return renderMessages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, renderMessages]);

  const onChatBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget; // Use currentTarget instead of target
    const bottomHeight = target.scrollTop + target.clientHeight;
    const edgeThreshold = target.clientHeight;

    // Determine if the user is at the top or bottom edge of the chat.
    const isTouchTopEdge = target.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= target.scrollHeight - edgeThreshold;
    const isHitBottom = bottomHeight >= target.scrollHeight - (isMobileScreen ? 4 : 10);

    
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;
    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    // Only update state if necessary to prevent infinite loop
    // this fix memory leaks
    if (hitBottom !== isHitBottom) {
      setHitBottom(isHitBottom);
      setAutoScroll(isHitBottom);
    }
  }, [
    setHitBottom,
    setAutoScroll,
    isMobileScreen,
    msgRenderIndex,
    setMsgRenderIndex, // Added setMsgRenderIndex
    hitBottom, // Include hitBottom in the dependency array
  ]);

  // Use the custom hook to debounce the onChatBodyScroll function
  useDebouncedEffect(() => {
    const scrollContainer = scrollRef.current;
    const handleScrollEvent = (event: Event) => {
      onChatBodyScroll(event as unknown as React.UIEvent<HTMLDivElement>);
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScrollEvent);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScrollEvent);
      }
    };
  }, [onChatBodyScroll], 100);

  function scrollToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  // clear context index = context length + index in messages
  const clearContextIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length - msgRenderIndex
      : -1;

  const [showPromptModal, setShowPromptModal] = useState(false);

  const clientConfig = useMemo(() => getClientConfig(), []);

  const autoFocus = !isMobileScreen; // wont auto focus on mobile screen
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;

  useCommand({
    fill: (text) => {
      // Call setUserInput only if text is a string
      if (text !== undefined) {
        setUserInput(text);
      }
    },
    submit: (text) => {
      // Call doSubmit only if text is a string
      if (text !== undefined) {
        doSubmit(text);
      }
    },
    code: (text) => {
      // Exit if fast link is disabled or text is undefined
      if (accessStore.disableFastLink || text === undefined) return;
      console.log("[Command] got code from url: ", text);
      showConfirm(Locale.URLCommand.Code + `code = ${text}`).then((res) => {
        if (res) {
          accessStore.update((access) => (access.accessCode = text));
        }
      });
    },
    settings: (text) => {
      if (accessStore.disableFastLink || typeof text !== 'string') return;

      try {
        const payload = JSON.parse(text) as {
          key?: string;
          url?: string;
        };

        console.log("[Command] got settings from url: ", payload);

        showConfirm(
          Locale.URLCommand.Settings +
          `\n${JSON.stringify(payload, null, 4)}`,
        ).then((res) => {
          if (!res) return;
          accessStore.update((access) => {
            // Only update openaiApiKey if payload.key is a string
            if (typeof payload.key === 'string') {
              access.openaiApiKey = payload.key;
            }
            // Only update openaiUrl if payload.url is a string
            if (typeof payload.url === 'string') {
              access.openaiUrl = payload.url;
            }
          });
        });
      } catch {
        console.error("[Command] failed to get settings from url: ", text);
      }
    },
  });

  // edit / insert message modal
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  // TODO: The final improvement needed is to fix the "UNFINISHED_INPUT" overwriting issue that occurs when a user clicks 'start new conversation'. 
  // After this, I will return to working on the backend with Golang.

  // useRef is used to persist the previous session ID across renders without triggering a re-render.
  const previousSessionIdRef = useRef(session.id);

  useEffect(() => {
    // Retrieve the previous session ID stored in the ref.
    const previousSessionId = previousSessionIdRef.current;

    // Check if the previous session ID is no longer present in the chat store.
    // If it's not, it indicates that the session has been deleted and we should clear the unfinished input.
    if (!chatStore.sessions.some(s => s.id === previousSessionId)) {
      clearUnfinishedInputForSession(previousSessionId);
    }

    // Update the ref with the new session ID for the next render.
    previousSessionIdRef.current = session.id;

    // This cleanup function will be called when the component unmounts or when the dependencies of the effect change.
    // It ensures that the unfinished input for the current session is cleared if the component unmounts
    // or if the session is deleted from the chat store.
    return () => {
      clearUnfinishedInputForSession(session.id);
    };
    // The effect depends on session.id and chatStore.sessions to determine when to run.
    // It should run when the session ID changes or when the list of sessions in the chat store updates.
  }, [session.id, chatStore.sessions]);

  // Define the key for storing unfinished input based on the session ID outside of the useEffect.
  const key = UNFINISHED_INPUT(session.id);

  // Define a function that calls the debounced function, wrapped in useCallback.
  const saveUnfinishedInput = useCallback((input: string) => {
    debouncedSave(input, key);
  }, [key]);

  // Call the save function whenever userInput changes.
  // remember unfinished input
  useEffect(() => {
    saveUnfinishedInput(userInput);
  }, [userInput, saveUnfinishedInput]);

  // Load unfinished input when the component mounts or session ID changes.
  useEffect(() => {
    const mayBeUnfinishedInput = localStorage.getItem(key);
    if (mayBeUnfinishedInput && userInput.length === 0) {
      setUserInput(mayBeUnfinishedInput);
      // Optionally clear the unfinished input from local storage after loading it.
      // Note: The removal of "localStorage.removeItem(key);" here is intentional. 
      // The preservation of input is already handled by the debounced function, which simplifies the stupid complexity.
    }

    // Capture the current value of the input reference.
    const currentInputRef = inputRef.current;

    // This cleanup function will run when the component unmounts or the session.id changes.
    return () => {
      // Save the current input to local storage only if it is not a command.
      // Use the captured value from the input reference.
      const currentInputValue = currentInputRef?.value ?? "";
      // Save the input to local storage only if it's not empty and not a command.
      if (currentInputValue && !currentInputValue.startsWith(ChatCommandPrefix)) {
        localStorage.setItem(key, currentInputValue);
      } else {
        // If there's no value, ensure we don't create an empty key in local storage.
        localStorage.removeItem(key);
      }
    };
    // The effect should depend on the session ID to ensure it runs when the session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  async function uploadImage() {
    const maxImages = 3;
    if (uploading) return;
    new Promise<string[]>((res, rej) => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept =
        "image/png, image/jpeg, image/webp, image/heic, image/heif";
      fileInput.multiple = true;
      fileInput.onchange = (event: any) => {
        setUploading(true);
        const files = event.target.files;
        const imagesData: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = event.target.files[i];
          compressImage(file, 256 * 1024)
            .then((dataUrl) => {
              imagesData.push(dataUrl);
              if (
                imagesData.length + attachImages.length >= maxImages ||
                imagesData.length === files.length
              ) {
                setUploading(false);
                res(imagesData);
              }
            })
            .catch((e) => {
              rej(e);
            });
        }
      };
      fileInput.click();
    })
      .then((imagesData) => {
        const images: string[] = [];
        images.push(...attachImages);
        images.push(...imagesData);
        setAttachImages(images);
        const imagesLength = images.length;
        if (imagesLength > maxImages) {
          images.splice(maxImages, imagesLength - maxImages);
        }
        setAttachImages(images);
      })
      .catch(() => {
        setUploading(false);
      });
  }

  function openImageBox(src: string, alt?: string) {
    alt = alt ?? "";
    setImageBoxData({ src, alt });
    setShowImageBox(true);
  }

  // this now better
  const scrollToBottomSmooth = () => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      const scrollHeight = scrollContainer.scrollHeight;
      const height = scrollContainer.clientHeight;
      const maxScrollTop = scrollHeight - height;
      scrollContainer.scrollTo({ top: maxScrollTop, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.chat} key={session.id}>
      <ImageBox
        showImageBox={showImageBox}
        data={imageBoxData}
        closeImageBox={() => setShowImageBox(false)}
      ></ImageBox>
      <div className="window-header" data-tauri-drag-region>
        {isMobileScreen && (
          <div className="window-actions">
            <div className={"window-action-button"}>
              <IconButton
                icon={<ReturnIcon />}
                bordered
                title={Locale.Chat.Actions.ChatList}
                onClick={() => navigate(Path.Home)}
              />
            </div>
          </div>
        )}

        <div className={`window-header-title ${styles["chat-body-title"]}`}>
          <div
            className={`window-header-main-title ${styles["chat-body-main-title"]}`}
            onClickCapture={() => setIsEditingMessage(true)}
          >
            {!session.topic ? DEFAULT_TOPIC : session.topic}
          </div>
          <div className="window-header-sub-title">
            {Locale.Chat.SubTitle(session.messages.length)}
          </div>
        </div>
        <div className="window-actions">
          {!isMobileScreen && (
            <div className="window-action-button">
              <IconButton
                icon={<RenameIcon />}
                bordered
                onClick={() => setIsEditingMessage(true)}
              />
            </div>
          )}
          <div className="window-action-button">
            <IconButton
              icon={<ExportIcon />}
              bordered
              title={Locale.Chat.Actions.Export}
              onClick={() => {
                setShowExport(true);
              }}
            />
            </div>
          {!showMaxIcon && isApp ? (
            <div className="window-action-button">
              <IconButton
                icon={<PinIcon />}
                bordered
                title={Locale.Chat.Actions.Pin}
                onClick={togglePinApp} // Call the enablePinApp function
              />
            </div>
          ) : null}
          {showMaxIcon && (
            <div className="window-action-button">
              <IconButton
                icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
                bordered
                onClick={() => {
                  config.update(
                    (config) => (config.tightBorder = !config.tightBorder),
                  );
                }}
              />
            </div>
          )}
        </div>

        <PromptToast
          showToast={!hitBottom}
          showModal={showPromptModal}
          setShowModal={setShowPromptModal}
        />
      </div>

      <div
        className={styles["chat-body"]}
        ref={scrollRef}
        onScroll={onChatBodyScroll} // Pass the event directly
        onMouseDown={() => inputRef.current?.blur()}
        onTouchStart={() => {
          inputRef.current?.blur();
          setAutoScroll(false);
        }}
      >
        {messages.map((message, i) => {
          const isUser = message.role === "user";
          const isContext = i < context.length;
          const isAssistant = message.role === "assistant";
          const isDallEModel = session.mask.modelConfig.model.startsWith("dall-e");

          const showActions =
            i > 0 &&
            !(message.preview || message.content.length === 0) &&
            !isContext;
          const showTyping = message.preview || message.streaming;

          const shouldShowClearContextDivider = i === clearContextIndex - 1;

          return (
            <Fragment key={message.id}>
              <div
                className={
                  isUser ? styles["chat-message-user"] : styles["chat-message"]
                }
              >
                <div className={styles["chat-message-container"]}>
                  <div className={styles["chat-message-header"]}>
                    <div className={styles["chat-message-avatar"]}>
                      <div className={styles["chat-message-edit"]}>
                        <IconButton
                          icon={<EditIcon />}
                          onClick={async () => {
                            const newMessage = await showPrompt(
                              Locale.Chat.Actions.Edit,
                              getMessageTextContent(message),
                              10,
                            );
                            let newContent: string | MultimodalContent[] =
                              newMessage;
                            const images = getMessageImages(message);
                            if (images.length > 0) {
                              newContent = [{ type: "text", text: newMessage }];
                              for (let i = 0; i < images.length; i++) {
                                newContent.push({
                                  type: "image_url",
                                  image_url: {
                                    url: images[i],
                                  },
                                });
                              }
                            }
                            chatStore.updateCurrentSession((session) => {
                              const m = session.mask.context
                                .concat(session.messages)
                                .find((m) => m.id === message.id);
                              if (m) {
                                m.content = newContent;
                              }
                            });
                          }}
                        ></IconButton>
                      </div>
                      {isUser ? (
                        <Avatar avatar={config.avatar} />
                      ) : isContext ? (
                        <Avatar avatar="1f4ab" /> // Add this line for system messages
                      ) : (
                        <>
                          {["system"].includes(message.role) ? (
                            <Avatar avatar="2699-fe0f" />
                          ) : (
                            <MaskAvatar
                              avatar={session.mask.avatar}
                              model={
                                message.model || session.mask.modelConfig.model
                              }
                            />
                          )}
                        </>
                      )}
                    </div>

                    {showActions && (
                      <div className={styles["chat-message-actions"]}>
                        <div className={styles["chat-input-actions"]}>
                          {message.streaming ? (
                            <ChatAction
                              text={Locale.Chat.Actions.Stop}
                              icon={<StopIcon />}
                              onClick={() => onUserStop(message.id ?? i)}
                            />
                          ) : (
                            <>
                              <ChatAction
                                text={Locale.Chat.Actions.Retry}
                                icon={<ResetIcon />}
                                onClick={() => onResend(message)}
                              />

                              <ChatAction
                                text={Locale.Chat.Actions.Delete}
                                icon={<DeleteIcon />}
                                onClick={() => onDelete(message.id ?? i)}
                              />

                              <ChatAction
                                text={Locale.Chat.Actions.Pin}
                                icon={<PinIcon />}
                                onClick={() => onPinMessage(message)}
                              />
                              <ChatAction
                                text={Locale.Chat.Actions.Copy}
                                icon={<CopyIcon />}
                                onClick={() =>
                                  copyToClipboard(
                                    getMessageTextContent(message),
                                  )
                                }
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {showTyping && (isAssistant || isUser) ? (
                    <div className={styles["chat-message-status"]}>
                      {isAssistant && isDallEModel
                        ? Locale.Chat.GeneratingImage
                        : Locale.Chat.Typing}
                    </div>
                  ) : null}
                  <div className={styles["chat-message-item"]}>
                    <Markdown
                      content={getMessageTextContent(message)}
                      loading={
                        (message.preview || message.streaming) &&
                        message.content.length === 0 &&
                        !isUser
                      }
                      onContextMenu={(e) => onRightClick(e, message)}
                      onDoubleClickCapture={() => {
                        if (!isMobileScreen) return;
                        setUserInput(getMessageTextContent(message));
                      }}
                      fontSize={fontSize}
                      parentRef={scrollRef}
                      defaultShow={i >= messages.length - 6}
                      openImageBox={openImageBox}
                    />
                    {getMessageImages(message).length == 1 && (
                      // this fix when uploading
                      // Note: ignore a fucking stupid "1750:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element"
                      // In scenario how it work, this already handle in other side for example, when you use gemini-pro-vision
                      <img
                        className={styles["chat-message-item-image"]}
                        src={getMessageImages(message)[0]}
                        alt=""
                        onClick={() =>
                          openImageBox(getMessageImages(message)[0])
                        }
                      />
                    )}
                    {getMessageImages(message).length > 1 && (
                      <div
                        className={styles["chat-message-item-images"]}
                        style={
                          {
                            "--image-count": getMessageImages(message).length,
                          } as React.CSSProperties
                        }
                      >
                        {getMessageImages(message).map((image, index) => {
                          return (
                            <Image
                              className={
                                styles["chat-message-item-image-multi"]
                              }
                              key={index}
                              src={image}
                              alt=""
                              layout="responsive"
                              onClick={() => openImageBox(image)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className={styles["chat-message-action-date"]}>
                    {isContext
                      ? `${Locale.Chat.IsContext}${!isMobileScreen ? ` - ${Locale.Exporter.Model}: ${message.model || session.mask.modelConfig.model}` : ''}`
                      : `${Locale.Exporter.Time}: ${message.date.toLocaleString()}${!isMobileScreen ? ` - ${Locale.Exporter.Model}: ${message.model || session.mask.modelConfig.model}` : ''}`}
                  </div>
                </div>
              </div>
              {shouldShowClearContextDivider && <ClearContextDivider />}
            </Fragment>
          );
        })}
      </div>

      <div className={styles["chat-input-panel"]}>
        <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect} />

        <ChatActions
          uploadImage={uploadImage}
          setAttachImages={setAttachImages}
          setUploading={setUploading}
          showPromptModal={() => setShowPromptModal(true)}
          scrollToBottom={scrollToBottomSmooth}
          hitBottom={hitBottom}
          uploading={uploading}
          showPromptHints={() => {
            // Click again to close
            if (promptHints.length > 0) {
              setPromptHints([]);
              return;
            }

            inputRef.current?.focus();
            setUserInput("/");
            onSearch("");
          }}
          showContextPrompts={false}
          toggleContextPrompts={() => showToast(Locale.WIP)}
          attachImages={attachImages}
        />
        <label
          className={`${styles["chat-input-panel-inner"]} ${
            attachImages.length != 0
              ? styles["chat-input-panel-inner-attach"]
              : ""
          }`}
          htmlFor="chat-input"
        >
          <textarea
            id="chat-input"
            ref={inputRef}
            className={styles["chat-input"]}
            placeholder={Locale.Chat.Input(submitKey)}
            onInput={(e) => onInput(e.currentTarget.value)}
            value={userInput}
            onKeyDown={onInputKeyDown}
            onFocus={scrollToBottom}
            onClick={scrollToBottom}
            rows={inputRows}
            autoFocus={autoFocus}
            style={{
              fontSize: config.fontSize,
            }}
          />
          {attachImages.length != 0 && (
            <div className={styles["attach-images"]}>
              {attachImages.map((image, index) => {
                return (
                  <div
                    key={index}
                    className={styles["attach-image"]}
                    style={{ backgroundImage: `url("${image}")` }}
                    onClick={() => openImageBox(image)}
                  >
                    <div className={styles["attach-image-mask"]}>
                      <DeleteImageButton
                        deleteImage={() => {
                          setAttachImages(
                            attachImages.filter((_, i) => i !== index),
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <IconButton
            icon={<SendWhiteIcon />}
            text={Locale.Chat.Send}
            className={styles["chat-input-send"]}
            type="primary"
            onClick={() => doSubmit(userInput)}
          />
        </label>
      </div>

      {showExport && (
        <ExportMessageModal onClose={() => setShowExport(false)} />
      )}

      {isEditingMessage && (
        <EditMessageModal
          onClose={() => {
            setIsEditingMessage(false);
          }}
        />
      )}
    </div>
  );
}

export function Chat() {
  const chatStore = useChatStore();
  const sessionIndex = chatStore.currentSessionIndex;
  return <_Chat key={sessionIndex}></_Chat>;
}
