import {
    useAppConfig,
    useChatStore,
} from "@/app/store"; // Assuming these types exist

/**
 * Retrieves the configuration for new stuff based on the provided model.
 * 
 * @param model - The model name.
 * @param max_tokens - The maximum number of tokens.
 * @param system_fingerprint - The system fingerprint.
 * @param useMaxTokens - Indicates whether to use the maximum number of tokens.
 * @returns An object containing the configuration for new stuff:
 *   - max_tokens: The maximum number of tokens.
 *   - system_fingerprint: The system fingerprint.
 *   - isNewModel: Indicates if the model is new.
 *   - payloadType: The type of payload ('chat' or 'image').
 *   - isDalle: Indicates if the model is a DALL-E model.
 * @author H0llyW00dzZ
 */
export function getNewStuff(
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
 * Returns the model name for the given input model, accounting for instruct versions (For Instruct Version Still WIP).
 * If the input model is not found in the model map, it returns the input model as is.
 * @param inputModel - The input model name.
 * @returns The corresponding model name or the input model if not found.
 * @author H0llyW00dzZ
 */

export function getModelForInstructVersion(inputModel: string): string {
    const modelMap: Record<string, string> = {
        "dall-e-2-beta-instruct-vision": "dall-e-2",
        "dall-e-3-beta-instruct-vision": "dall-e-3",
    };
    return modelMap[inputModel] || inputModel;
}
