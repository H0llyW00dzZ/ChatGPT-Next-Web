import { Google, REQUEST_TIMEOUT_MS } from "@/app/constant";
import { ChatOptions, getHeaders, LLMApi, LLMModel, LLMUsage } from "../api";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";
import { prettyObject } from "@/app/utils/format";
import { getClientConfig } from "@/app/config/client";
import Locale from "../../locales";
import { getServerSideConfig } from "@/app/config/server";

// Define interfaces for your payloads and responses to ensure type safety.
// Copyright (c) 2023 H0llyW00dzZ
interface GoogleResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

interface MessagePart {
  text: string;
}

interface Message {
  role: string;
  parts: MessagePart[];
}

// Define a type for model configuration that is used within the chat method.
interface ModelConfig {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  // top_k?: number; // Uncomment and add to the interface if used.
  model?: string;
}

export class GeminiProApi implements LLMApi {
  extractMessage(res: GoogleResponse): string {
    console.log("[Response] gemini-pro response: ", res);

    return (
      res.candidates?.[0]?.content?.parts?.[0]?.text ||
      res.error?.message ||
      ""
    );
  }

  async chat(options: ChatOptions): Promise<void> {
    const messages: Message[] = options.messages.map((v) => ({
      role: v.role.replace("assistant", "model").replace("system", "user"),
      parts: [{ text: v.content }],
    }));

    // google requires that role in neighboring messages must not be the same
    for (let i = 0; i < messages.length - 1; ) {
      if (messages[i].role === messages[i + 1].role) {
        messages[i].parts = messages[i].parts.concat(messages[i + 1].parts);
        messages.splice(i + 1, 1);
      } else {
        i++;
      }
    }

    const appConfig = useAppConfig.getState().modelConfig;
    const chatConfig = useChatStore.getState().currentSession().mask.modelConfig;
    const modelConfig: ModelConfig = {
      ...appConfig,
      ...chatConfig,
      model: options.config.model,
    };

    const requestPayload = {
      contents: messages,
      generationConfig: {
        // stopSequences: [
        //   "Title"
        // ],
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.max_tokens,
        topP: modelConfig.top_p,
        // "topK": modelConfig.top_k,
      },
    };

    console.log("[Request] google payload: ", requestPayload);

    // todo: support stream later
    const shouldStream = false;
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPath = this.path(Google.ChatPath);
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
            const fetchCount = Math.max(1, Math.round(remainText.length / 60));
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

        fetchEventSource(chatPath, {
          ...chatPayload,
          async onopen(res) {
            clearTimeout(requestTimeoutId);
            const contentType = res.headers.get("content-type");
            console.log(
              "[OpenAI] request response content type: ",
              contentType,
            );

            if (contentType?.startsWith("text/plain")) {
              responseText = await res.clone().text();
              return finish();
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
              const json = JSON.parse(text) as {
                choices: Array<{
                  delta: {
                    content: string;
                  };
                }>;
              };
              const delta = json.choices[0]?.delta?.content;
              if (delta) {
                remainText += delta;
              }
            } catch (e) {
              console.error("[Request] parse error", text);
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

        if (resJson?.promptFeedback?.blockReason) {
          // being blocked
          options.onError?.(
            new Error(
              "Message is being blocked for reason: " +
                resJson.promptFeedback.blockReason,
            ),
          );
        }
        const message = this.extractMessage(resJson);
        options.onFinish(message);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  }

  usage(): Promise<LLMUsage> {
    throw new Error("Method not implemented.");
  }
  async models(): Promise<LLMModel[]> {
    return [];
  }
  // todo: fix tauri desktop app issue, currently focusing passing a context to the ai first
  path(endpoint: string): string {
    return `/api/google/${endpoint}`;
  }
}
