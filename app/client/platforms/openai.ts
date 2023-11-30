import {
  ApiPath,
  DEFAULT_API_HOST,
  DEFAULT_MODELS,
  OpenaiPath,
  REQUEST_TIMEOUT_MS,
  ServiceProvider,
} from "@/app/constant";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";

import { ChatOptions, getHeaders, LLMApi, LLMModel, LLMUsage } from "../api";
import Locale from "../../locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { prettyObject } from "@/app/utils/format";
import { getClientConfig } from "@/app/config/client";
import { makeAzurePath } from "@/app/azure";
/**
 * Models Text-Moderations OpenAI
 * Author: @H0llyW00dzZ
 **/
interface ModerationResponse {
  flagged: boolean;
  categories: Record<string, boolean>;
}

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

export class ChatGPTApi implements LLMApi {
  private disableListModels = true;

  path(path: string): string {
    const accessStore = useAccessStore.getState();

    const isAzure = accessStore.provider === ServiceProvider.Azure;

    if (isAzure && !accessStore.isValidAzure()) {
      throw Error(
        "incomplete azure config, please check it in your settings page",
      );
    }

    let baseUrl = isAzure ? accessStore.azureUrl : accessStore.openaiUrl;

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      baseUrl = isApp ? DEFAULT_API_HOST : ApiPath.OpenAI;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http") && !baseUrl.startsWith(ApiPath.OpenAI)) {
      baseUrl = "https://" + baseUrl;
    }

    if (isAzure) {
      path = makeAzurePath(path, accessStore.azureApiVersion);
    }

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.choices?.at(0)?.message?.content ?? "";
  }

  /**
   * Retrieves information about the new stuff.
   *
   * @param model - The model to retrieve information for.
   * @param max_tokens - The maximum number of tokens.
   * @param system_fingerprint - The system fingerprint.
   * @param useMaxTokens - Whether to use the maximum number of max tokens.
   * @returns An object containing information about the new stuff.
   *
   * @author H0llyW00dzZ
   */
  private getNewStuff(
    model: string,
    max_tokens?: number,
    system_fingerprint?: string,
    useMaxTokens: boolean = true,
  ): {
    max_tokens?: number;
    system_fingerprint?: string;
    isNewModel: boolean;
    payloadType: 'chat' | 'image';
    isDalle: boolean;
  } {
    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
    };
    const isNewModel = model.endsWith("-preview");
    const isDalle = model.startsWith("dall-e");
    let payloadType: 'chat' | 'image' = 'chat';

    if (isNewModel) {
      return {
        max_tokens: useMaxTokens ? (max_tokens !== undefined ? max_tokens : modelConfig.max_tokens) : undefined,
        system_fingerprint:
          system_fingerprint !== undefined
            ? system_fingerprint
            : modelConfig.system_fingerprint,
        isNewModel: true,
        payloadType,
        isDalle,
      };
    } else if (isDalle) {
      payloadType = 'image';
    }

    return {
      isNewModel: false,
      payloadType,
      isDalle,
    };
  }

  /**
   * Retrieves the service provider based on the access store.
   * @returns The service provider as a string.
   * @author H0llyW00dzZ
   */
  private getServiceProvider(): string {
    const accessStore = useAccessStore.getState();
    let provider = "";
  
    if (accessStore.provider === ServiceProvider.Azure) {
      provider = ServiceProvider.Azure;
    } else if (accessStore.provider === ServiceProvider.OpenAI) {
      provider = ServiceProvider.OpenAI;
    }
  
    return provider;
  }

  /**
   * Initiates a chat with the specified options.
   * 
   * @param options - The chat (LLM's method by Yidadaa) options.
   * @returns A Promise that resolves to the chat and images response.
   * 
   * @remarks
   * This method sends chat and images messages to the OpenAI API & Azure and handles text moderation if enabled.
   * 
   */
  async chat(options: ChatOptions) {
    /**
     * The text moderation configuration.
     * @remarks
     * This variable stores the text moderation settings obtained from the app configuration.
     * @author H0llyW00dzZ
     */
    const textmoderation = useAppConfig.getState().textmoderation;
    const latest = OpenaiPath.TextModerationModels.latest;
    const checkprovider = this.getServiceProvider();
    if (textmoderation
      && DEFAULT_MODELS
      && options.whitelist !== true
      && checkprovider !== ServiceProvider.Azure) { // Skip text moderation for Azure provider since azure already have text-moderation, and its enabled by default on their service
      const messages = options.messages.map((v) => ({
        role: v.role,
        content: v.content,
      }));

      const userMessages = messages.filter((msg) => msg.role === "user");
      const userMessage = userMessages[userMessages.length - 1]?.content;

      if (userMessage) {
        const moderationPath = this.path(OpenaiPath.ModerationPath);
        const moderationPayload = {
          input: userMessage,
          model: latest,
        };

        try {
          const moderationResponse = await this.sendModerationRequest(
            moderationPath,
            moderationPayload
          );

          if (moderationResponse.flagged) {
            const flaggedCategories = Object.entries(
              moderationResponse.categories
            )
              .filter(([category, flagged]) => flagged)
              .map(([category]) => category);

            if (flaggedCategories.length > 0) {
              const translatedReasons = flaggedCategories.map((category) => {
                const translation =
                  (Locale.Error.Content_Policy.Reason as any)[category];
                return translation ? translation : category; // Use category name if translation is not available
              });
              const translatedReasonText = translatedReasons.join(", ");
              const responseText = `${Locale.Error.Content_Policy.Title}\n${Locale.Error.Content_Policy.Reason.Title}: ${translatedReasonText}\n${Locale.Error.Content_Policy.SubTitle}\n`;

              const responseWithGraph = responseText;
              options.onFinish(responseWithGraph);
              return;
            }
          }
        } catch (e) {
          console.log("[Request] failed to make a moderation request", e);
          const error = {
            error: (e as Error).message,
            stack: (e as Error).stack,
          };
          options.onFinish(JSON.stringify(error));
          return;
        }
      }
    }

    const messages = options.messages.map((v) => ({
      role: v.role,
      content: v.content,
    }));

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...useChatStore.getState().currentSession().mask.modelConfig,
      ...{
        model: options.config.model,
      },
    };

    const cfgspeed_animation = useAppConfig.getState().speed_animation;       

    const defaultModel = modelConfig.model;

    const userMessages = messages.filter((msg) => msg.role === "user");
    const userMessage = userMessages[userMessages.length - 1]?.content;
    /**
     * Represents the actual model used for DALL·E Models.
     * @author H0llyW00dzZ
     * @remarks This is the actual model used for DALL·E Models.
     * @usage in this chat: prompt
     * @example : A Best Picture of Andromeda Galaxy
     */
    const actualModel = this.getModelForInstructVersion(modelConfig.model);
    const { max_tokens, system_fingerprint } = this.getNewStuff(
      modelConfig.model,
      modelConfig.max_tokens,
      modelConfig.system_fingerprint,
      modelConfig.useMaxTokens,
    );

    /**
     * Payloads for making requests to the OpenAI API.
     * 
     * @remarks
     * This object contains two properties: `chat` and `image`. The `chat` payload is used for sending chat messages to the API, while the `image` payload is used for generating images based on a prompt.
     * 
     * @author H0llyW00dzZ
     */
    const requestPayloads = {
      chat: {
        messages,
        stream: options.config.stream,
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        presence_penalty: modelConfig.presence_penalty,
        frequency_penalty: modelConfig.frequency_penalty,
        top_p: modelConfig.top_p,
        // beta test for new model's since it consumed much tokens
        // max is 4096
        ...(max_tokens !== undefined ? { max_tokens } : {}), // Spread the max_tokens value if defined
        // not yet ready
        //...{ system_fingerprint }, // Spread the system_fingerprint value
      },
      image: {
        model: actualModel,
        prompt: userMessage,
        n: modelConfig.n,
        quality: modelConfig.quality,
        style: modelConfig.style,
        size: modelConfig.size,
      },
    };

    /**
     * Represents the magic payload typescript parameter 🎩 🪄.
     * 
     * @remarks
     * This constant includes the provider and is used to store the result of the `getNewStuff` method.
     * 
     * @author H0llyW00dzZ
     */
    const magicPayload = this.getNewStuff(defaultModel);
    const provider = this.getServiceProvider();

    let payload;
    if (magicPayload.isDalle) {
      if (defaultModel.includes("dall-e-2")) {
        const { quality, style, ...imagePayload } = requestPayloads.image;
        payload = { image: imagePayload };
      } else {
        payload = { image: requestPayloads.image };
      }
    } else if (magicPayload.isNewModel) {
      payload = { chat: requestPayloads.chat };
    } else {
      const { max_tokens, ...oldChatPayload } = requestPayloads.chat;
      payload = { chat: oldChatPayload };
    }

    console.log(`[Request] [${provider}] payload: `, payload);

    const shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      /**
       * Represents the dallemodels variable.
       * @author H0llyW00dzZ
       */
      const dallemodels = magicPayload.isDalle;

      let chatPath = dallemodels
        ? this.path(OpenaiPath.ImageCreationPath)
        : this.path(OpenaiPath.ChatPath);

      let requestPayload;
      if (dallemodels) {
        /**
         * Author : @H0llyW00dzZ
         * Use the image payload structure
         */
        if (defaultModel.includes("dall-e-2")) {
          /**
           * Magic TypeScript payload parameter 🎩 🪄
           **/
          const { quality, style, ...imagePayload } = requestPayloads.image;
          requestPayload = imagePayload;
        } else {
          requestPayload = requestPayloads.image;
        }
      } else {
        /**
         * Use the chat model payload structure
         */
        requestPayload = requestPayloads.chat;
      }

      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: getHeaders(),
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      if (shouldStream) {
        let responseText = "";
        let remainText = "";
        let finished = false;

        // animate response to make it looks smooth
        function animateResponseText() {
          if (finished || controller.signal.aborted) {
            responseText += remainText;
            console.log("[Response Animation] finished");
            return;
          }

          if (remainText.length > 0) {
            const fetchCount = Math.max(1, Math.round(remainText.length / cfgspeed_animation)); // Lower values will result in faster animation
            const fetchText = remainText.slice(0, fetchCount);
            responseText += fetchText;
            remainText = remainText.slice(fetchCount);
            options.onUpdate?.(responseText, fetchText);
          }

          requestAnimationFrame(animateResponseText);
        }

        // start animaion
        animateResponseText();

        const finish = () => {
          if (!finished) {
            finished = true;
            options.onFinish(responseText + remainText);
          }
        };

        controller.signal.onabort = finish;

        const isApp = !!getClientConfig()?.isApp;
        const apiPath = "api/openai/";

        fetchEventSource(chatPath, {
          ...chatPayload,
          async onopen(res) {
            clearTimeout(requestTimeoutId);
            const contentType = res.headers.get("content-type");
            console.log(`[ServiceProvider] [${provider}] request response content type: `, contentType);

            if (contentType?.startsWith("text/plain")) {
              responseText = await res.clone().text();
            } else if (contentType?.startsWith("application/json") 
              && magicPayload.isDalle) { // only dall-e
              const jsonResponse = await res.clone().json();
              const imageUrl = jsonResponse.data?.[0]?.url;
              const prompt = requestPayloads.image.prompt;
              const revised_prompt = jsonResponse.data?.[0]?.revised_prompt;
              const index = requestPayloads.image.n - 1;
              const size = requestPayloads.image.size;
              const InstrucModel = defaultModel.endsWith("-vision");

              if (defaultModel.includes("dall-e-3")) {
                const imageDescription = `| ![${revised_prompt}](${imageUrl}) |\n|---|\n| Size: ${size} |\n| [Download Here](${imageUrl}) |\n| 🎩 🪄 Revised Prompt (${index + 1}): ${revised_prompt} |\n| 🤖 AI Models: ${defaultModel} |`;

                responseText = `${imageDescription}`;
              } else {
                const imageDescription = `#### ${prompt} (${index + 1})\n\n\n | ![${imageUrl}](${imageUrl}) |\n|---|\n| Size: ${size} |\n| [Download Here](${imageUrl}) |\n| 🤖 AI Models: ${defaultModel} |`;

                responseText = `${imageDescription}`;
              }

              if (InstrucModel) {
                const instructx = await fetch(
                  (isApp ? DEFAULT_API_HOST : apiPath) + OpenaiPath.ChatPath, // Pass the path parameter
                  {
                    method: "POST",
                    body: JSON.stringify({
                      messages: [
                        ...messages,
                      ],
                      model: "gpt-4-vision-preview",
                      temperature: modelConfig.temperature,
                      presence_penalty: modelConfig.presence_penalty,
                      frequency_penalty: modelConfig.frequency_penalty,
                      top_p: modelConfig.top_p,
                      // have to add this max_tokens for dall-e instruct
                      max_tokens: modelConfig.max_tokens,
                    }),
                    headers: getHeaders(),
                  }
                );
                clearTimeout(requestTimeoutId);
                const instructxx = await instructx.json();

                const instructionDelta = instructxx.choices?.[0]?.message?.content;
                const instructionPayload = {
                  messages: [
                    ...messages,
                    {
                      role: "system",
                      content: instructionDelta,
                    },
                  ],
                  model: "gpt-4-vision-preview",
                  temperature: modelConfig.temperature,
                  presence_penalty: modelConfig.presence_penalty,
                  frequency_penalty: modelConfig.frequency_penalty,
                  top_p: modelConfig.top_p,
                  max_tokens: modelConfig.max_tokens,
                };

                const instructionResponse = await fetch(
                  (isApp ? DEFAULT_API_HOST : apiPath) + OpenaiPath.ChatPath,
                  {
                    method: "POST",
                    body: JSON.stringify(instructionPayload),
                    headers: getHeaders(),
                  }
                );

                const instructionJson = await instructionResponse.json();
                const instructionMessage = instructionJson.choices?.[0]?.message?.content; // Access the appropriate property containing the message
                const imageDescription = `| ![${prompt}](${imageUrl}) |\n|---|\n| Size: ${size} |\n| [Download Here](${imageUrl}) |\n| 🤖 AI Models: ${defaultModel} |`;

                responseText = `${imageDescription}\n\n${instructionMessage}`;
              }

              if (
                !res.ok ||
                !res.headers
                  .get("content-type")
                  ?.startsWith(EventStreamContentType) ||
                res.status !== 200
              ) {
                let anyinfo = await res.clone().text();
                try {
                  const infJson = await res.clone().json();
                  anyinfo = prettyObject(infJson);
                } catch { }
                if (res.status === 401) {
                  responseText = "\n\n" + Locale.Error.Unauthorized;
                }
                if (res.status !== 200) {
                  if (anyinfo) {
                    responseText += "\n\n" + anyinfo;
                  }
                }
                return;
              }
            }
            if (
              !res.ok ||
              !res.headers
                .get("content-type")
                ?.startsWith(EventStreamContentType) ||
              res.status !== 200
            ) {
              const responseTexts = [responseText];
              let extraInfo = await res.clone().text();
              try {
                const resJson = await res.clone().json();
                extraInfo = prettyObject(resJson);
              } catch {}

              if (res.status === 401) {
                responseTexts.push(Locale.Error.Unauthorized);
              }

              if (extraInfo) {
                responseTexts.push(extraInfo);
              }

              responseText = responseTexts.join("\n\n");

              return finish();
            }
          },
          onmessage(msg) {
            if (msg.data === "[DONE]" || finished) {
              return finish();
            }
            const text = msg.data;
            try {
              const json = JSON.parse(text);
              const choices = json.choices as Array<{ delta: { content: string } }>;
              const delta = choices[0]?.delta?.content;
              const textmoderation = json?.prompt_filter_results;

              if (delta) {
                remainText += delta;
              }

              if (textmoderation 
                  && textmoderation.length > 0 
                  && provider === ServiceProvider.Azure) {
                const contentFilterResults = textmoderation?.[0]?.content_filter_results;
                console.log(`[${provider}] [Text Moderation] flagged categories result:`, contentFilterResults);
              }
            } catch (e) {
              console.error("[Request] parse error", text, msg);
            }
          },
          onclose() {
            finish();
          },
          onerror(e) {
            options.onError?.(e);
            throw e;
          },
          openWhenHidden: true,
        });
      } else {
        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);
        options.onFinish(message);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }

  async usage() {
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    const ONE_DAY = 1 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = formatDate(startOfMonth);
    const endDate = formatDate(new Date(Date.now() + ONE_DAY));

    const [used, subs] = await Promise.all([
      fetch(
        this.path(
          `${OpenaiPath.UsagePath}?start_date=${startDate}&end_date=${endDate}`
        ),
        {
          method: "GET",
          headers: getHeaders(),
        }
      ),
      fetch(this.path(OpenaiPath.SubsPath), {
        method: "GET",
        headers: getHeaders(),
      }),
    ]);

    if (used.status === 401) {
      throw new Error(Locale.Error.Unauthorized);
    }

    if (!used.ok || !subs.ok) {
      throw new Error("Failed to query usage from openai");
    }

    const response = (await used.json()) as {
      total_usage?: number;
      error?: {
        type: string;
        message: string;
      };
    };

    const total = (await subs.json()) as {
      hard_limit_usd?: number;
      system_hard_limit_usd?: number;
    };

    if (response.error && response.error.type) {
      throw Error(response.error.message);
    }

    if (response.total_usage) {
      response.total_usage = Math.round(response.total_usage) / 100;
    }

    if (total.hard_limit_usd) {
      total.hard_limit_usd = Math.round(total.hard_limit_usd * 100) / 100;
    }

    if (total.system_hard_limit_usd) {
      total.system_hard_limit_usd =
        Math.round(total.system_hard_limit_usd * 100) / 100;
    }

    return {
      used: response.total_usage,
      total: {
        hard_limit_usd: total.hard_limit_usd,
        system_hard_limit_usd: total.system_hard_limit_usd,
      },
    } as unknown as LLMUsage;
  }

  async models(): Promise<LLMModel[]> {
    if (this.disableListModels) {
      return DEFAULT_MODELS.slice();
    }

    const res = await fetch(this.path(OpenaiPath.ListModelPath), {
      method: "GET",
      headers: {
        ...getHeaders(),
      },
    });

    const resJson = (await res.json()) as OpenAIListModelResponse;
    const chatModels = resJson.data?.filter((m) => m.id.startsWith("gpt-"));
    console.log("[Models]", chatModels);

    if (!chatModels) {
      return [];
    }

    return chatModels.map((m) => ({
      name: m.id,
      available: true,
    }));
  }

  /**
   * Sends a moderation request to the specified moderation path with the given payload.
   * @param moderationPath The path for the moderation request.
   * @param moderationPayload The payload for the moderation request.
   * @returns A promise that resolves to a ModerationResponse object.
   * @throws An error if the moderation response is empty or if the moderation request fails.
   * @author H0llyW00dzZ
   */
  private async sendModerationRequest(
    moderationPath: string,
    moderationPayload: any
  ): Promise<ModerationResponse> {
    try {
      const moderationResponse = await fetch(moderationPath, {
        method: "POST",
        body: JSON.stringify(moderationPayload),
        headers: getHeaders(),
      });

      const moderationJson = await moderationResponse.json();
      const provider = this.getServiceProvider();

      if (moderationJson.results && moderationJson.results.length > 0) {
        let moderationResult = moderationJson.results[0]; // Access the first element of the array

        if (!moderationResult.flagged) {
          const stable = OpenaiPath.TextModerationModels.stable; // Fall back to "stable" if "latest" is still false
          moderationPayload.model = stable;
          const fallbackModerationResponse = await fetch(moderationPath, {
            method: "POST",
            body: JSON.stringify(moderationPayload),
            headers: getHeaders(),
          });

          const fallbackModerationJson =
            await fallbackModerationResponse.json();

          if (
            fallbackModerationJson.results &&
            fallbackModerationJson.results.length > 0
          ) {
            moderationResult = fallbackModerationJson.results[0]; // Access the first element of the array
          }
        }

        console.log(`[${provider}] [Text Moderation] flagged:`, moderationResult.flagged); // Log the flagged result

        if (moderationResult.flagged) {
          const flaggedCategories = Object.entries(moderationResult.categories)
            .filter(([category, flagged]) => flagged)
            .map(([category]) => category);

          console.log(`[${provider}] [Text Moderation] flagged categories:`, flaggedCategories); // Log the flagged categories
        }

        return moderationResult as ModerationResponse;
      } else {
        console.error(`[${provider}] [Text Moderation] Moderation response is empty`);
        throw new Error(`[${provider}] [Text Moderation] Failed to get moderation response`);
      }
    } catch (e) {
      console.error("[Request] failed to make a moderation request", e);
      return {} as ModerationResponse;
    }
  }
  /**
   * Returns the model name for the given input model, accounting for instruct versions (For Instruct Version Still WIP).
   * If the input model is not found in the model map, it returns the input model as is.
   * @param inputModel - The input model name.
   * @returns The corresponding model name or the input model if not found.
   * @author H0llyW00dzZ
   */

  private getModelForInstructVersion(inputModel: string): string {
    const modelMap: Record<string, string> = {
      "dall-e-2-beta-instruct-vision": "dall-e-2",
      "dall-e-3-beta-instruct-vision": "dall-e-3",
    };
    return modelMap[inputModel] || inputModel;
  }
  /**
   * Saves the image from the response to the local filesystem.
   * @param imageResponse - The response containing the image data.
   * @param filename - The name of the file to be saved.
   * @returns A Promise that resolves when the image is saved successfully.
   * @throws If there is an error while saving the image.
   * @todo Implement the actual saving logic.
   * @note This method is currently not used. and subject to changed if there is a better way to save or store the image. (e.g. using own blob storage or aws s3,etc)
   * @author H0llyW00dzZ
   */
  private async saveImageFromResponse(imageResponse: any, filename: string): Promise<void> {
    try {
      const blob = await imageResponse.blob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);

      console.log('Image saved successfully:', filename);
    } catch (e) {
      console.error('Failed to save image:', e);
    }
  }
}

export { OpenaiPath };
