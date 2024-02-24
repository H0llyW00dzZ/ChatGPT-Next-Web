import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeHighlight from "rehype-highlight";
import { useRef, useState, RefObject, useEffect, useMemo } from "react";
import { copyToClipboard } from "../utils";
import mermaid from "mermaid";

import LoadingIcon from "../icons/three-dots.svg";
import React from "react";
import { useDebouncedCallback } from "use-debounce";
import { showImageModal } from "./ui-lib";

export function Mermaid(props: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true);
          console.error("[Mermaid] ", e.message);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.code]);

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: "image/svg+xml" });
    showImageModal(URL.createObjectURL(blob));
  }

  if (hasError) {
    return null;
  }

  return (
    <div
      className="no-dark mermaid"
      style={{
        cursor: "pointer",
        overflow: "auto",
      }}
      ref={ref}
      onClick={() => viewSvgInNewWindow()}
    >
      {props.code}
    </div>
  );
}

export function PreCode(props: { children: any }) {
  const ref = useRef<HTMLPreElement>(null);
  const refText = ref.current?.innerText;
  const [mermaidCode, setMermaidCode] = useState("");

  const renderMermaid = useDebouncedCallback(() => {
    if (!ref.current) return;
    const mermaidDom = ref.current.querySelector("code.language-mermaid");
    if (mermaidDom) {
      setMermaidCode((mermaidDom as HTMLElement).innerText);
    }
  }, 600);

  useEffect(() => {
    setTimeout(renderMermaid, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refText]);

  return (
    <>
      {mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
      <pre ref={ref}>
        <span
          className="copy-code-button"
          onClick={() => {
            if (ref.current) {
              const code = ref.current.innerText;
              copyToClipboard(code);
            }
          }}
        ></span>
        {props.children}
      </pre>
    </>
  );
}
// Function to escape dollar signs in LaTeX and any code blocks format, including single backticks
function escapeDollarNumber(text: string) {
  let escapedText = "";
  let isInMathExpression = false;
  let isInCodeBlock = false;

  const codeBlockStartRegex = /^`{1,3}|`$/;

  for (let i = 0; i < text.length; i += 1) {
    let char = text[i];
    const nextChar = text[i + 1] || " ";

    // Toggle the isInMathExpression flag when encountering a dollar sign
    if (char === "$") {
      isInMathExpression = !isInMathExpression;
    }

    // Toggle the isInCodeBlock flag when encountering a code block start indicator
    if (codeBlockStartRegex.test(char)) {
      isInCodeBlock = !isInCodeBlock;
    }

    // If inside a code block, preserve the character as is
    if (isInCodeBlock) {
      escapedText += char;
      continue;
    }

    // Preserve the double dollar sign in math expressions
    if (char === "$" && nextChar === "$") {
      char = "$$"; // Preserve the double dollar sign
      i += 1; // Skip the next dollar sign since we have already included it
    }
    // Escape a single dollar sign followed by a number outside of math expressions
    else if (char === "$" && nextChar >= "0" && nextChar <= "9" && !isInMathExpression) {
      char = "&#36;" + nextChar; // Use HTML entity &#36; to represent the dollar sign
      i += 1; // Skip the next character since we have already included it
    }

    escapedText += char;
  }

  return escapedText;
}
// With this combination, the maximum number of `$` signs in one line is 4 (without single backtick or any codeblocks) for example: $0000 $1000 $0001 $0000.
// Also the maximum number of `$` signs in single backticks or any codeblock is infinite
// For AI, this is sufficient and won't cause any formatting errors while escaping it from LaTeX.
function escapeDollarMathNumber(text: string) {
  let escapedText = "";
  let isInMathExpression = false;
  let isInCodeBlock = false;

  const codeBlockStartRegex = /^`{1,3}|`$/;

  for (let i = 0; i < text.length; i += 1) {
    let char = text[i];
    const nextChar = text[i + 1] || " ";

    // Toggle the isInMathExpression flag when encountering a dollar sign
    if (char === "$") {
      isInMathExpression = !isInMathExpression;
    }

    // Toggle the isInCodeBlock flag when encountering a code block start indicator
    if (codeBlockStartRegex.test(char)) {
      isInCodeBlock = !isInCodeBlock;
    }

    // If inside a code block, preserve the character as is
    if (isInCodeBlock) {
      escapedText += char;
      continue;
    }

    // Preserve the double dollar sign in math expressions
    if (char === "$" && nextChar === "$") {
      char = "$$"; // Preserve the double dollar sign
      i += 1; // Skip the next dollar sign since we have already included it
    }
    // Escape a single dollar sign followed by a number outside of math expressions
    else if (char === "$" && nextChar >= "0" && nextChar <= "9" && !isInMathExpression) {
      char = "&#36;" + nextChar; // Use HTML entity &#36; to represent the dollar sign
      i += 1; // Skip the next character since we have already included it
    }

    escapedText += char;
  }

  return escapedText;
}

function _MarkDownContent(props: { content: string }) {
  const escapedContent = useMemo(() => {
    let processedContent = props.content;
    if (processedContent.includes("$")) {
      processedContent = escapeDollarMathNumber(processedContent);
    }
    processedContent = escapeDollarNumber(processedContent);
    return processedContent;
  }, [props.content]);

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={[
        RehypeKatex,
        [
          RehypeHighlight,
          {
            detect: false,
            ignoreMissing: true,
          },
        ],
      ]}
      components={{
        pre: PreCode,
        p: (pProps) => <p {...pProps} dir="auto" />,
        a: (aProps) => {
          const href = aProps.href || "";
          const isInternal = /^\/#/i.test(href);
          const target = isInternal ? "_self" : aProps.target ?? "_blank";
          return <a {...aProps} target={target} />;
        },
      }}
    >
      {escapedContent}
    </ReactMarkdown>
  );
}

export const MarkdownContent = React.memo(_MarkDownContent);

export function Markdown(
  props: {
    content: string;
    loading?: boolean;
    fontSize?: number;
    parentRef?: RefObject<HTMLDivElement>;
    defaultShow?: boolean;
    openImageBox?: (src: string) => void;
  } & React.DOMAttributes<HTMLDivElement>,
) {
  const mdRef = useRef<HTMLDivElement>(null);
  const { parentRef, openImageBox } = props;

  useEffect(() => {
    if (!parentRef || !openImageBox) {
      return;
    }
    const imgs = mdRef.current?.querySelectorAll("img");
    if (imgs) {
      imgs.forEach((img) => {
        img.addEventListener("click", (e) => {
          e.preventDefault();
          openImageBox(img.getAttribute("src") ?? "");
        });
      });
    }
  }, [mdRef, parentRef, openImageBox]);

  return (
    <div
      className="markdown-body"
      style={{
        fontSize: `${props.fontSize ?? 14}px`,
      }}
      ref={mdRef}
      onContextMenu={props.onContextMenu}
      onDoubleClickCapture={props.onDoubleClickCapture}
      dir="auto"
    >
      {props.loading ? (
        <LoadingIcon />
      ) : (
        <MarkdownContent content={props.content} />
      )}
    </div>
  );
}
