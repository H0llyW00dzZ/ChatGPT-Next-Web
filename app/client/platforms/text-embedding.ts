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
import Papa from "papaparse";

// Define the structure of the CSV row based on the expected columns
interface CsvRow {
  [columnName: string]: string | undefined; // Use 'undefined' as well since some columns might be missing
}

// Function to call the OpenAI API to get text embeddings
export async function textEmbedding(inputTexts: string[], embeddingPath: string, model: string): Promise<any> {
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
      throw new Error('Failed to get text embeddings from OpenAI');
    }

    return await response.json();
  } catch (e) {
    console.error('Failed to make a text embedding request', e);
    throw e;
  }
}

// This function is responsible for reading CSV, parsing it, and getting embeddings
export async function getTextEmbeddingsFromCSV(file: File, embeddingPath: string, columnName: string, model: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target) {
        const csvData = e.target.result as string;
        Papa.parse(csvData, {
          header: true,
          complete: async (results) => {
            const textsToEmbed = (results.data as CsvRow[]).map(row => row[columnName] || '');

            // Now we have the texts, let's get the embeddings
            try {
              const embeddings = await textEmbedding(textsToEmbed, embeddingPath, model);
              resolve(embeddings);
            } catch (error) {
              console.error('Failed to make a text embedding request', error);
              reject(error);
            }
          },
          error: (error: any) => {
            console.error('Error parsing CSV file', error);
            reject(error);
          }
        });
      } else {
        reject(new Error('FileReader event target is null'));
      }
    };

    reader.onerror = (error) => {
      console.error('Error reading CSV file', error);
      reject(error);
    };

    reader.readAsText(file);
  });
}
