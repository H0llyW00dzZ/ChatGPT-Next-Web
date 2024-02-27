/**
 * This module provides functions for interacting with Google's AI or OpenAI models.
 * @module LLMApi
 * @author H0llyW00dzZ
 * @copyright (c) 2023 H0llyW00dzZ
 */
import {
    useAppConfig,
    useChatStore,
} from "@/app/store"; // Assuming these types exist

/**
 * Retrieves the configuration for new features based on the provided model.
 * 
 * @param model - The model name.
 * @param max_tokens - The maximum number of tokens.
 * @param useMaxTokens - Indicates whether to use the maximum number of tokens.
 * @returns An object containing the configuration for new features:
 *   - max_tokens: The maximum number of tokens.
 *   - maxOutputTokens: The maximum number of tokens for Google AI.
 *   - system_fingerprint: The system fingerprint.
 *   - isNewModel: Indicates if the model is new.
 *   - payloadType: The type of payload ('chat' or 'image').
 *   - isDalle: Indicates if the model is a DALL-E model.
 */
export function getNewStuff(
    model: string,
    max_tokens?: number,
    useMaxTokens: boolean = true,
): {
    max_tokens?: number;
    maxOutputTokens?: number; // This is the same as maxTokens but for Google AI
    isNewModel: boolean;
    payloadType: 'chat' | 'image';
    isDalle: boolean;
} {
    const modelConfig = {
        ...useAppConfig.getState().modelConfig,
        ...useChatStore.getState().currentSession().mask.modelConfig,
    };
    const isNewModel = model.endsWith("-preview") || model.startsWith("gemini-pro");
    const isDalle = model.startsWith("dall-e");
    let payloadType: 'chat' | 'image' = 'chat';

    let tokens = useMaxTokens ? max_tokens ?? modelConfig.max_tokens : undefined;

    if (isNewModel || isDalle) {
        payloadType = isDalle ? 'image' : 'chat';
        return {
            max_tokens: tokens,
            maxOutputTokens: tokens, // Assign the same value to maxOutputTokens
            isNewModel: true,
            payloadType,
            isDalle,
        };
    }

    return {
        isNewModel: false,
        payloadType,
        isDalle,
    };
}

/**
 * Returns the model name for the given input model, accounting for instruct versions.
 * If the input model is not found in the model map, it returns the input model as is.
 * 
 * @param inputModel - The input model name.
 * @returns The corresponding model name or the input model if not found.
 */
export function getModelForInstructVersion(inputModel: string): string {
    const modelMap: Record<string, string> = {
        "dall-e-2-beta-instruct-vision": "dall-e-2",
        "dall-e-3-beta-instruct-vision": "dall-e-3",
    };
    return modelMap[inputModel] ?? inputModel;
}
