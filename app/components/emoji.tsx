import EmojiPicker, {
  Emoji,
  EmojiStyle,
  Theme as EmojiTheme,
} from "emoji-picker-react";
import React from "react";
import { ModelType } from "../store";

import BotIcon from "../icons/bot.svg";
import BlackBotIcon from "../icons/black-bot.svg";

export function getEmojiUrl(unified: string, style: EmojiStyle) {
  const isAppleDevice = /(iPhone|iPod|iPad)/i.test(navigator.userAgent);
  const emojiDataSource =
    (isAppleDevice && style === "apple") ||
    (!isAppleDevice && style === "google")
      ? "emoji-datasource-apple"
      : "emoji-datasource-google";

  const emojiStyle = style === "apple" && isAppleDevice ? "apple" : "google";

  return `https://cdn.staticfile.org/${emojiDataSource}/14.0.0/img/${emojiStyle}/64/${unified}.png`;
}

export function debounce(func: Function, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

export function AvatarPicker(props: {
  onEmojiClick: (emojiId: string) => void;
}) {
  const debouncedEmojiClick = React.useCallback(
    debounce(props.onEmojiClick, 300), // Debounce with a delay of 300 milliseconds
    [props.onEmojiClick],
  );

  return (
    <EmojiPicker
      lazyLoadEmojis
      theme={EmojiTheme.AUTO}
      getEmojiUrl={getEmojiUrl}
      onEmojiClick={(e) => {
        debouncedEmojiClick(e.unified);
      }}
    />
  );
}

export function Avatar(props: { model?: ModelType; avatar?: string }) {
  if (props.model) {
    return (
      <div className="no-dark">
        {props.model?.startsWith("gpt-4") ? (
          <BlackBotIcon className="user-avatar" />
        ) : (
          <BlackBotIcon className="user-avatar" />
        )}
      </div>
    );
  }

  return (
    <div className="user-avatar">
      {props.avatar && <EmojiAvatar avatar={props.avatar} />}
    </div>
  );
}

export function EmojiAvatar(props: { avatar: string; size?: number }) {
  return (
    <Emoji
      unified={props.avatar}
      size={props.size ?? 18}
      getEmojiUrl={getEmojiUrl}
    />
  );
}
