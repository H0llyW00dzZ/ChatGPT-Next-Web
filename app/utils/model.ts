import { LLMModel } from "../client/api";

export function collectModelTable(
  models: readonly LLMModel[],
  customModels: string,
) {
  const modelTable: Record<
    string,
    { available: boolean; name: string; displayName: string }
  > = {};

  // default models
  models.forEach(
    (m) =>
      (modelTable[m.name] = {
        ...m,
        displayName: m.name,
      }),
  );

  // server custom models
  customModels
    .split(",")
    .filter((v) => !!v && v.length > 0)
    .map((m) => {
      const available = !m.startsWith("-");
      const nameConfig =
        m.startsWith("+") || m.startsWith("-") ? m.slice(1) : m;
      const [name, displayName] = nameConfig.split(":") && nameConfig.split("|"); // `|` is aliases for fine-tuning model OpenAI (E.g Usage : ft:gpt-3.5-turbo-1106:github-developer-program::88ufxjNg|Fine-Tuning-1)
      modelTable[name] = {
        name,
        displayName: displayName || name,
        available,
      };
    });
  return modelTable;
}

/**
 * Generate full model table.
 */
export function collectModels(
  models: readonly LLMModel[],
  customModels: string,
) {
  const modelTable = collectModelTable(models, customModels);
  const allModels = Object.values(modelTable);

  return allModels;
}
