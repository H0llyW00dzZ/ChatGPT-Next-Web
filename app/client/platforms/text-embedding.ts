// text-embedding.ts
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
import Locale from "../../locales";
import { makeAzurePath } from "@/app/azure";
import Papa from "papaparse";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";
import { getProviderFromState } from "@/app/utils"; // Assuming you have a function to get the provider from the state

/**
 * Represents a row in a CSV file.
 * @author H0llyW00dzZ
 */
interface CsvRow {
  [columnName: string]: string | undefined; // Use 'undefined' as well since some columns might be missing
}

// Function to call the OpenAI API to get text embeddings
/**
 * Embeds the given input texts using the specified model and returns the result.
 * @param inputTexts - An array of input texts to be embedded.
 * @param embeddingPath - The path to the embedding endpoint.
 * @param model - The name of the model to be used for embedding.
 * @returns A promise that resolves to the embedded texts.
 * @throws An error if the embedding request fails.
 * @author H0llyW00dzZ
 */
export async function textEmbedding(inputTexts: string[], embeddingPath: string, model: string): Promise<any> {
  const provider = getProviderFromState(); // Get the provider when needed
  try {
    const payload = {
      input: inputTexts,
      model: model,
    };

    const response = await fetch(embeddingPath, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`[${provider}] ${Locale.ThrowError.TextEmbedding}`);
    }

    return await response.json();
  } catch (e) {
    console.error(`[${provider}] ${Locale.ThrowError.TextEmbeddingRequest}`, e);
    throw e;
  }
}

// This function is responsible for reading CSV, parsing it, and getting embeddings
/**
 * Reads a CSV file and retrieves text embeddings for a specified column using a given embedding path and model.
 * @param file - The CSV file to read.
 * @param embeddingPath - The path to the text embedding resource.
 * @param columnName - The name of the column containing the text to embed.
 * @param model - The name of the text embedding model.
 * @returns A promise that resolves with the text embeddings.
 * @author H0llyW00dzZ
 */
export async function getTextEmbeddingsFromCSV(file: File, embeddingPath: string, columnName: string, model: string): Promise<any> {
  const provider = getProviderFromState(); // Get the provider when needed
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target) {
        const csvData = e.target.result as string;
        Papa.parse(csvData, {
          header: true,
          complete: async (results) => {
            const textsToEmbed = (results.data as CsvRow[]).map(row => row[columnName] || '');

            // Now we have the texts, let's get the embeddings not only python LOL
            // Reason: Python so slow
            try {
              const embeddings = await textEmbedding(textsToEmbed, embeddingPath, model);
              resolve(embeddings);
            } catch (error) {
              console.error(`[${provider}] ${Locale.ThrowError.TextEmbeddingRequest}`, error);
              reject(error);
            }
          },
          error: (error: any) => {
            console.error(`${Locale.ThrowError.ParsingCSV}`, error);
            reject(error);
          }
        });
      } else {
        // better handling error response
        console.error(`${Locale.ThrowError.FileReader(file.name)}`, e);
        reject(new Error(Locale.ThrowError.FileReader(file.name)));
      }
    };

    reader.onerror = (error) => {
      console.error(`${Locale.ThrowError.ReadingCSV}`, error);
      reject(error);
    };

    reader.readAsText(file);
  });
}
