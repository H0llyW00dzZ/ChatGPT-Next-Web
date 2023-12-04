/**
 * Sends a moderation request to the specified moderation path with the given payload.
 * @param moderationPath The path for the moderation request.
 * @param moderationPayload The payload for the moderation request.
 * @returns A promise that resolves to a ModerationResponse object.
 * @throws An error if the moderation response is empty or if the moderation request fails.
 * @author H0llyW00dzZ
 */
import { getHeaders } from "../api";
import { OpenaiPath } from "@/app/constant";
import { getProviderFromState } from "@/app/utils";

/**
 * Represents the response from the moderation request.
 */
export interface ModerationResponse {
    flagged: boolean;
    categories: Record<string, boolean>;
}

/**
 * Represents the payload for the moderation request.
 */
export interface ModerationPayload {
    input: string;
    model: string;
}

/**
 * Sends a moderation request to the specified moderation path with the given payload.
 * @param moderationPath The path for the moderation request.
 * @param moderationPayload The payload for the moderation request.
 * @returns A promise that resolves to a ModerationResponse object.
 * @throws An error if the moderation response is empty or if the moderation request fails.
 */
export async function sendModerationRequest(
    moderationPath: string,
    moderationPayload: ModerationPayload
): Promise<ModerationResponse> {
    try {
        const moderationResponse = await fetch(moderationPath, {
            method: "POST",
            body: JSON.stringify(moderationPayload),
            headers: getHeaders(),
        });

        if (!moderationResponse.ok) {
            // Handle non-2xx responses
            throw new Error(`[${moderationResponse.status}] Failed to get moderation response`);
        }

        const moderationJson = await moderationResponse.json();
        const provider = getProviderFromState();

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

                const fallbackModerationJson = await fallbackModerationResponse.json();

                if (fallbackModerationJson.results && fallbackModerationJson.results.length > 0) {
                    moderationResult = fallbackModerationJson.results[0]; // Access the first element of the array
                }
            }

            console.log(`[${provider}] [Text Moderation] flagged:`, moderationResult.flagged); // Log the flagged result

            if (moderationResult.flagged) {
                const flaggedCategories = Object.entries(moderationResult.categories)
                    .filter(([_, flagged]) => flagged)
                    .map(([category]) => category);

                console.log(`[${provider}] [Text Moderation] flagged categories:`, flaggedCategories); // Log the flagged categories
            }

            return moderationResult as ModerationResponse;
        } else {
            console.error(`[${provider}] [Text Moderation] Moderation response is empty`);
            throw new Error(`[${provider}] [Text Moderation] Moderation response is empty`);
        }
    } catch (e) {
        console.error("[Request] failed to make a moderation request", e);
        throw e; // Rethrow the error after logging
    }
}
