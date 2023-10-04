import styles from "./changelog.module.scss";
import { IconButton } from "./button";
import { getClientConfig } from "@/app/config/client";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Path } from "../constant";
import Locale from "../locales";

import ConfirmIcon from "../icons/confirm.svg";
import LoadingIcon from "../icons/three-dots.svg";
import dynamic from "next/dynamic";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

export function ChangeLog(props: { onClose?: () => void }) {
  const navigate = useNavigate();
  const [mdText, setMdText] = useState("");
  const [pageTitle] = useState("📌 Change Log 📝");

  useEffect(() => {
    const fetchData = async () => {
      const commitInfo = getClientConfig();

      let table = `## 🚀 What's Changed ? ${commitInfo?.commitDate
          ? new Date(parseInt(commitInfo.commitDate)).toLocaleString()
          : "Unknown Date"
      } 🗓️\n`;

      if (commitInfo?.commitMessage.description) {
        const author = commitInfo.Author || "Unknown Author";
        const coAuthored = commitInfo.commitMessage["Co-authored-by"] || [];
        const changes = commitInfo.commitMessage.description.filter(
          (change: string) => !change.startsWith("...")
        );
        const changesFormatted = changes
          .map((change: string) => `\n\n\n   ${change}\n\n`)
          .join("\n\n\n");

        let coAuthorsSection = "";
        if (coAuthored.length > 0) {
          const coAuthorLinks = coAuthored.map(
            (coAuthor: string) =>
              `[${coAuthor.replace("[bot]", "")}](https://github.com/${coAuthor.replace("[bot]", "")})`
          );
          coAuthorsSection = `(Co-Authored by ${coAuthorLinks.join(", ")})`;
        }

        const authorSection = `[${author.replace("[bot]", "")}](https://github.com/${author.replace("[bot]", "")}) ${coAuthorsSection}`;

        table += `\n\n\n  ![${author.replace("[bot]", "")}](https://github.com/${author.replace("[bot]", "")}.png?size=25) ${authorSection} :\n\n${commitInfo?.commitMessage.summary}\n\n\n${changesFormatted}\n\n\n`;
      } else {
        table += `###${commitInfo?.commitMessage.summary}###\nNo changes\n\n`;
      }

      setMdText(table);
    };

    fetchData();

  }, []);

  const goHome = () => {
    navigate(Path.Home);
  };

  return (
    <div className={styles["changelog-page"]}>
      <div className={`changelog-title ${styles["changelog-title"]}`}>
        {pageTitle}
      </div>
      <div className={styles["changelog-content"]}>
        <div className={styles["markdown-body"]}>
          <Markdown content={mdText} />
        </div>
      </div>
      <div className={styles["changelog-actions"]}>
        <div className={styles["changelog-actions-button"]}>
          <IconButton
            text={Locale.UI.Close}
            icon={<ConfirmIcon />}
            onClick={goHome}
            bordered
          />
        </div>
      </div>
    </div>
  );
}
