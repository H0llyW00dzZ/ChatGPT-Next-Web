import { LLMModel } from "../client/api";
import { isMacOS } from "../utils";
import { getClientConfig } from "../config/client";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SIDEBAR_WIDTH,
  StoreKey,
} from "../constant";
import { createPersistStore } from "../utils/store";

export type ModelType = (typeof DEFAULT_MODELS)[number]["name"];

export enum SubmitKey {
  Enter = "Enter",
  CtrlEnter = "Ctrl + Enter",
  ShiftEnter = "Shift + Enter",
  AltEnter = "Alt + Enter",
  MetaEnter = "Meta + Enter",
}

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

export const DEFAULT_CONFIG = {
  lastUpdate: Date.now(), // timestamp, to merge state

  submitKey: isMacOS() ? SubmitKey.MetaEnter : SubmitKey.CtrlEnter,
  avatar: "1f603",
  fontSize: 14,
  theme: Theme.Auto as Theme,
  tightBorder: !!getClientConfig()?.isApp,
  sendPreviewBubble: true,
  enableAutoGenerateTitle: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,

  disablePromptHint: false,

  dontShowMaskSplashScreen: false, // dont show splash screen when create chat
  hideBuiltinMasks: false, // dont add builtin masks

  customModels: "",
  models: DEFAULT_MODELS as any as LLMModel[],

  modelConfig: {
    model: "gpt-3.5-turbo" as ModelType,
    temperature: 0.5,
    top_p: 1,
    max_tokens: 2000,
    presence_penalty: 0,
    frequency_penalty: 0,
    /**
     * DALL·E Models
     * Author: @H0llyW00dzZ
     *
     **/
    n: 1, // The number of images to generate. Must be between 1 and 10. For dall-e-3, only n=1 is supported.
    /** Quality Only DALL·E-3 Models
     * Author: @H0llyW00dzZ
     * The quality of the image that will be generated. 
     * `hd` creates images with finer details and greater consistency across the image.
     **/
    quality: "hd", // Only DALL·E-3 for DALL·E-2 not not really needed
    /** SIZE ALL·E Models
     * Author: @H0llyW00dzZ
     * DALL·E-2 : Must be one of `256x256`, `512x512`, or `1024x1024`.
     * DALL-E-3 : Must be one of `1024x1024`, `1792x1024`, or `1024x1792`.
     **/
    size: "1024x1024",
    /** Style DALL-E-3 Models
     * Author: @H0llyW00dzZ
     * Must be one of `vivid` or `natural`. 
     * `Vivid` causes the model to lean towards generating hyper-real and dramatic images. 
     * `Natural` causes the model to produce more natural, less hyper-real looking images. 
     */
    style: "vivid", // Only DALL·E-3 for DALL·E-2 not not really needed
    system_fingerprint: "",
    sendMemory: true,
    useMaxTokens: false,
    historyMessageCount: 4,
    compressMessageLengthThreshold: 1000,
    enableInjectSystemPrompts: true,
    template: DEFAULT_INPUT_TEMPLATE,
  },
  /**
   * Text Moderation Open AI
   * Author: @H0llyW00dzZ
   **/
  textmoderation: true, // text moderation default is enabled

  desktopShortcut: "",
  speed_animation: 60, // Lower values will result in faster animation
};

export type ChatConfig = typeof DEFAULT_CONFIG;

export type ModelConfig = ChatConfig["modelConfig"];

export function limitNumber(
  x: number,
  min: number,
  max: number,
  defaultValue: number,
) {
  if (isNaN(x)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, x));
}

export const ModalConfigValidator = {
  model(x: string) {
    return x as ModelType;
  },
  max_tokens(x: number) {
    return limitNumber(x, 0, 512000, 1024);
  },
  presence_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  frequency_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  temperature(x: number) {
    return limitNumber(x, 0, 1, 1);
  },
  top_p(x: number) {
    return limitNumber(x, 0, 1, 1);
  },
  n(x: number) {
    return limitNumber(x, 1, 10, 1);
  },
  quality(x: string) {
    return ["hd"].includes(x) ? x : "hd";
  },
  size(x: string) {
    const validSizes = ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"];
    return validSizes.includes(x) ? x : ""; // default its already in model config settings
  },
  style(x: string) {
    const validStyles = ["vivid", "natural"];
    return validStyles.includes(x) ? x : ""; // default its already in model config settings
  },
  system_fingerprint(x: string) {
    // Example: Ensure the fingerprint matches the format "fp_XXXXXXXXXX" where X represents a hexadecimal digit
    const regex = /^fp_[0-9a-fA-F]{10}$/;
    return regex.test(x) ? x : "";
  },
};

/** Shortcut Regex Validator
 * Author: @H0llyW00dzZ
 * Regular expression `^(?:[a-zA-Z]+|\d+)(?:\+(?:[a-zA-Z]+|\d+))*$` is used to validate the shortcut format. Here's a breakdown of the regular expression:
  - `^` - Start of the string
  - `(?:[a-zA-Z]+|\d+)` - Matches one or more alphabetic characters or digits (e.g., `Ctrl`, `Alt`, `Shift`, `CmdOrControl`, `F12`, `Q`, etc.)
  - `(?:\+(?:[a-zA-Z]+|\d+))*` - Matches zero or more occurrences of a `+` followed by one or more alphabetic characters or digits (e.g., `+Ctrl`, `+Alt`, `+Shift`, `+CmdOrControl`, `+F12`, `+Q`, etc.)
  - `$` - End of the string
  Note: This Regex Validator for made types are safe, (e.g if there is package have CVE or something, it wont affected because sometimes when there is package got a CVE, and the patch still not available then it fucked up your project 🏴‍☠️.)
 **/

export const ShortcutValidator = {
  desktopShortcut(x: string) {
    const regex = /^(?:[a-zA-Z]+|\d+)(?:\+(?:[a-zA-Z]+|\d+))*$/;
    return regex.test(x) ? x : "";
  },
};

export const speed_animationValidator = {
  speed_animation(x: number) {
    return limitNumber(x, 1, 200, 1); // Set the range of 1 to 100 for the speed animation
  },
};

export const useAppConfig = createPersistStore(
  { ...DEFAULT_CONFIG },
  (set, get) => ({
    reset() {
      set(() => ({ ...DEFAULT_CONFIG }));
    },

    mergeModels(newModels: LLMModel[]) {
      if (!newModels || newModels.length === 0) {
        return;
      }

      const oldModels = get().models;
      const modelMap: Record<string, LLMModel> = {};

      for (const model of oldModels) {
        model.available = false;
        modelMap[model.name] = model;
      }

      for (const model of newModels) {
        model.available = true;
        modelMap[model.name] = model;
      }

      set(() => ({
        models: Object.values(modelMap),
      }));
    },

    allModels() {},
  }),
  {
    name: StoreKey.Config,
    version: 4.3, // DALL·E Models switching version to 4.1 because in 4.0 @Yidadaa using it.
    migrate(persistedState, version) {
      const state = persistedState as ChatConfig;

      if (version < 3.4) {
        state.modelConfig.sendMemory = true;
        state.modelConfig.historyMessageCount = 4;
        state.modelConfig.compressMessageLengthThreshold = 1000;
        state.modelConfig.frequency_penalty = 0;
        state.modelConfig.top_p = 1;
        state.modelConfig.template = DEFAULT_INPUT_TEMPLATE;
        state.dontShowMaskSplashScreen = false;
        state.hideBuiltinMasks = false;
      }

      if (version < 3.5) {
        state.customModels = "claude,claude-100k";
      }

      if (version < 3.6) {
        state.modelConfig.enableInjectSystemPrompts = true;
      }

      if (version < 3.7) {
        state.enableAutoGenerateTitle = true;
      }

      if (version < 3.8) {
        state.lastUpdate = Date.now();
      }

      if (version < 3.9) {
        state.textmoderation = true;
      }

      if (version < 4.1) {
        state.modelConfig = {
          ...state.modelConfig,
          n: 1,
          quality: "hd",
          size: "1024x1024",
          style: "vivid",
        };
      }

      // In the wilds 🚀 (still wip because it confusing for LLM + Generative AI Method)

      if (version < 4.2) {
        state.modelConfig = {
          ...state.modelConfig,
          system_fingerprint: "",
        };
      }

      // Speed Animation default is 30, Lower values will result in faster animation

      if (version < 4.3) {
        state.speed_animation = 60;
      }

      // control useMaxTokens for latest models gpt-4-1106-preview, default is false

      if (version < 4.4) {
        state.modelConfig.useMaxTokens = false;
      }

      return state as any;
    },
  },
);
