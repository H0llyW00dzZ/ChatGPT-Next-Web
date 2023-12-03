// textEmbedding.ts
// note: unused import are marked as todo
import {
    ApiPath,
    DEFAULT_API_HOST,
    DEFAULT_MODELS,
    OpenaiPath,
    REQUEST_TIMEOUT_MS,
    ServiceProvider,
  } from "@/app/constant";
import { prettyObject } from "@/app/utils/format";
import { 
    ChatOptions,
    getHeaders,
    LLMApi,
    LLMModel,
    LLMUsage } from "../api";

export async function textEmbedding(inputTexts: string[], embeddingPath: string): Promise<any> {
  try {
    const payload = {
      input: inputTexts,
    };

    const response = await fetch(embeddingPath, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to get text embeddings from OpenAI');
    }

    return await response.json();
  } catch (e) {
    console.error('Failed to make a text embedding request', e);
    throw e;
  }
}
