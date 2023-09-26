import tauriConfig from "../../src-tauri/tauri.conf.json";

export const getBuildConfig = () => {
  if (typeof process === "undefined") {
    throw Error(
      "[Server Config] you are importing a nodejs-only module outside of nodejs",
    );
  }

  const buildMode = process.env.BUILD_MODE ?? "standalone";
  const isApp = !!process.env.BUILD_APP;
  const version = "v" + tauriConfig.package.version;

  const commitInfo = (() => {
    try {
      const childProcess = require("child_process");
      const commitDate: string = childProcess
        .execSync('git log -1 --format="%at000" --date=unix')
        .toString()
        .trim();
      const commitHash: string = childProcess
        .execSync('git log --pretty=format:"%H" -n 1')
        .toString()
        .trim();
      const commitMessage: string = childProcess
        .execSync('git log --pretty=format:"%B" -n 1')
        .toString()
        .trim();
      const Author: string = childProcess
        .execSync('git log --pretty=format:"%an" -n 1')
        .toString()
        .trim();
      const coAuthorLine: string = childProcess
        .execSync('git log --format="%h %(trailers:key=Co-authored-by)" -n 1')
        .toString()
        .trim();
      const coAuthorMatch: RegExpMatchArray | null = coAuthorLine.match(
        /Co-authored-by:\s*(.*)/,
      );
      const coAuthors: string[] = coAuthorMatch
        ? coAuthorMatch[1]
            .trim()
            .split(">")
            .map((author) => author.trim())
        : [];

      const coAuthored: boolean = coAuthors.length > 0; // if coAuthorMatch is not null, set to true

      if (!commitMessage) {
        console.warn("[Build Config] No commit message available.");
      }

      const [title, ...messages] = commitMessage.split("\n");

      const uniqueMessages = messages
        .filter((message) => !message.startsWith("Co-authored-by:"))
        .filter((message) => !message.startsWith("Signed-off-by:"))
        .map((message) => message.replace(/\r/g, ""))
        .filter((message) => message.trim() !== "");

      const signedOffBy: string[] = commitMessage
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("Signed-off-by:"))
        .map(
          (line) =>
            line.substring("Signed-off-by:".length).trim().split(" <")[0],
        );

      const coAuthoredBy: string[] = commitMessage
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("Co-authored-by:"))
        .map(
          (line) =>
            line.substring("Co-authored-by:".length).trim().split(" <")[0],
        );

      const commitMessageObj = {
        summary: title || "No title",
        description: uniqueMessages.length > 0 ? uniqueMessages : undefined,
        "Co-authored-by": coAuthoredBy.length > 0 ? coAuthoredBy : undefined,
        "Signed-off-by": signedOffBy.length > 0 ? signedOffBy : undefined,
      };

      return {
        commitDate,
        commitHash,
        commitMessage: commitMessageObj,
        Author,
        coAuthored,
      };
    } catch (e) {
      console.error("[Build Config] No git or not from git repo.");
      return {
        commitDate: "unknown",
        commitHash: "unknown",
        commitMessage: {
          summary: "unknown",
          description: undefined,
          "Co-authored-by": undefined,
          "Signed-off-by": undefined,
        },
        Author: "unknown",
        coAuthored: undefined,
      };
    }
  })();

  return {
    version,
    ...commitInfo,
    buildMode,
    isApp,
  };
};

export type BuildConfig = ReturnType<typeof getBuildConfig>;
