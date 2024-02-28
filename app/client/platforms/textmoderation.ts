/**
 * This module provides functionality for sending text moderation Openai requests and processing their responses.
 * @module textmoderation
 * @author H0llyW00dzZ
 * @copyright (c) 2023 H0llyW00dzZ
 */
import { getHeaders } from "../api";
import { OpenaiPath } from "@/app/constant";
import { getProviderFromState } from "@/app/utils";
import Locale from "../../locales";

/**
 * Represents the response from the moderation request.
 * @interface
 */
export interface ModerationResponse {
    flagged: boolean; // Indicates if the input text was flagged by the moderation model.
    categories: Record<string, boolean>; // A dictionary of categories and their flagged status.
}

/**
 * Represents the payload for the moderation request.
 * @interface
 */
export interface ModerationPayload {
    input: string; // The input text to be moderated.
    model: string; // The moderation model to use.
}

/**
 * Sends a moderation request to the specified moderation path with the given payload.
 * @async
 * @function sendModerationRequest
 * @param {string} moderationPath - The path for the moderation request.
 * @param {ModerationPayload} moderationPayload - The payload for the moderation request.
 * @returns {Promise<ModerationResponse>} A promise that resolves to a ModerationResponse object.
 * @throws {Error} Throws an error if the moderation response is empty or if the moderation request fails.
 */
export async function sendModerationRequest(
    moderationPath: string,
    moderationPayload: ModerationPayload
): Promise<ModerationResponse> {
    try {
        const response = await fetch(moderationPath, {
            method: "POST",
            body: JSON.stringify(moderationPayload),
            headers: getHeaders(),
        });

        if (!response.ok) {
            // This a better way, interface error hahaaha
            const errorBody = await response.json(); // Attempt to read the response body
            // Use JSON.stringify to convert the error object to a string
            throw new Error(`[${response.status}] Failed to get moderation response: ${JSON.stringify(errorBody)}`);
        }

        const contentType = response.headers.get("Content-Type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Unexpected content type received from moderation response");
        }

        const moderationJson = await response.json();
        const provider = getProviderFromState();

        if (moderationJson.results && moderationJson.results.length > 0) {
            let moderationResult = moderationJson.results[0]; // Access the first element of the array

            if (!moderationResult.flagged) {
                const stable = OpenaiPath.TextModerationModels.stable; // Fall back to "stable" if "latest" is still false
                moderationPayload.model = stable;
                // Initiate a fallback request only if the initial moderation did not flag the content as problematic.
                // This condition assumes that the initial request was successful but did not identify any content violations.
                // Should the fallback request encounter an error, it triggers an exception, halting further processing.
                // This adjustment specifically addresses the issue of redundant logging when an error occurs during the initial request.
                const fallbackResponse = await fetch(moderationPath, {
                    method: "POST",
                    body: JSON.stringify(moderationPayload),
                    headers: getHeaders(),
                });

                if (!fallbackResponse.ok) {
                    // Immediately handle the error without attempting to parse further
                    const errorBody = await fallbackResponse.json();
                    console.error(`Fallback moderation request failed: ${JSON.stringify(errorBody)}`);
                    throw new Error(`[${fallbackResponse.status}] Failed to get fallback moderation response: ${JSON.stringify(errorBody)}`);
                }

                const fallbackJson = await fallbackResponse.json();
                if (fallbackJson.results && fallbackJson.results.length > 0) {
                    moderationResult = fallbackJson.results[0]; // Access the first element of the array
                }
            }

            logModerationResult(provider, moderationResult); // Log the flagged result
            return moderationResult as ModerationResponse;
        } else {
            console.error(`[${provider}] [Text Moderation] Moderation response is empty`);
            throw new Error(`[${provider}] [Text Moderation] Moderation response is empty`);
        }
    } catch (e) {
        console.error("[Request] Failed to make a moderation request", e);
        throw e; // Rethrow the error after logging
    }
}

/**
 * Processes a user message for moderation and returns a message indicating the moderation result.
 * @async
 * @function moderateText
 * @param {string} moderationPath - The path for the moderation request.
 * @param {string} userMessage - The user message to be moderated.
 * @param {string} latestModel - The latest moderation model to use.
 * @returns {Promise<string | null>} A promise that resolves to a string with the moderation message or null if no moderation is needed.
 * @throws {Error} Throws an error if the moderation request fails.
 */
export async function moderateText(
    moderationPath: string,
    userMessage: string,
    latestModel: string
): Promise<string | null> {

    if (!userMessage) return null;

    //const moderationPath = moderationPath;
    const moderationPayload = {
        input: userMessage,
        model: latestModel,
    };

    try {
        const moderationResponse = await sendModerationRequest(
            moderationPath,
            moderationPayload
        );

        if (moderationResponse.flagged) {
            const flaggedCategories = Object.entries(
                moderationResponse.categories
            )
                .filter(([_, flagged]) => flagged)
                .map(([category]) => category);

            if (flaggedCategories.length > 0) {
                return formatModerationMessage(flaggedCategories);  // Log the flagged categories
            }
        }
    } catch (e) {
        throw e; // Rethrow the error to be handled by the caller
    }
    // Note: This a nill in go hahaha
    return null; // No moderation needed
}

/**
 * Helper function to log the result of text moderation.
 */
function logModerationResult(provider: string, moderationResult: ModerationResponse) {
    console.log(`[${provider}] [Text Moderation] flagged:`, moderationResult.flagged);
    if (moderationResult.flagged) {
        const flaggedCategories = Object.entries(moderationResult.categories)
            .filter(([_, flagged]) => flagged)
            .map(([category]) => category);
        console.log(`[${provider}] [Text Moderation] flagged categories:`, flaggedCategories);
    }
}

/**
 * Formats the moderation message based on flagged categories.
 */
function formatModerationMessage(flaggedCategories: string[]): string {
    const translatedReasons = flaggedCategories.map(category => {
        const translation = Locale.Error.Content_Policy.Reason[category as keyof typeof Locale.Error.Content_Policy.Reason] || category;
        return translation;
    });
    const translatedReasonText = translatedReasons.join(", ");
    return `${Locale.Error.Content_Policy.Title}\n${Locale.Error.Content_Policy.Reason.Title}: ${translatedReasonText}\n${Locale.Error.Content_Policy.SubTitle}\n`;
}
