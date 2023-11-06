import binary from "spark-md5";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY?: string;
      CODE?: string;
      BASE_URL?: string;
      MODEL_LIST?: string;
      PROXY_URL?: string;
      VERCEL?: string;
      VERCEL_ANALYTICS?: boolean; // vercel web analytics
      HIDE_USER_API_KEY?: string; // disable user's api key input
      DISABLE_GPT4?: string; // allow user to use gpt-4 or not
      DISABLE_CUSTOMMODELS?: boolean; // allow user to use custom models or not
      BUILD_MODE?: "standalone" | "export";
      BUILD_APP?: string; // is building desktop app
      HIDE_BALANCE_QUERY?: string; // allow user to query balance or not
    }
  }
}

const ACCESS_CODES = (function getAccessCodes(): Set<string> {
  const code = process.env.CODE;

  try {
    const codes = (code?.split(",") ?? [])
      .filter((v) => !!v)
      .map((v) => binary.hash(v.trim()));
    return new Set(codes);
  } catch (e) {
    return new Set();
  }
})();

export const getServerSideConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const accessCodes = process.env.CODE?.split(",") ?? [];
  const codes = new Set(accessCodes.map((code) => binary.hash(code.trim())));
  const needCode = codes.size > 0;

  const apiKeys = new Map<string, string>();
  accessCodes.forEach((code, index) => {
    const apiKeyIndex = index < (apiKey?.split(",")?.length ?? 0) ? index : 0;
    const hashedCode = binary.hash(code.trim());
    const apiKeyValue = (apiKey?.split(",")?.[apiKeyIndex]?.trim() ?? "")!;
    apiKeys.set(hashedCode, apiKeyValue);
  });

  return {
    apiKey,
    code: process.env.CODE,
    codes,
    needCode,
    baseUrl: process.env.BASE_URL,
    proxyUrl: process.env.PROXY_URL,
    isVercel: !!process.env.VERCEL,
    isVercelWebAnalytics: !!process.env.VERCEL_ANALYTICS,
    hideUserApiKey: !!process.env.HIDE_USER_API_KEY,
    disableGPT4: !!process.env.DISABLE_GPT4,
    disableCustomModels: !!process.env.DISABLE_CUSTOMMODELS,
    hideBalanceQuery: !!process.env.HIDE_BALANCE_QUERY,
    apiKeys,
  };
};
