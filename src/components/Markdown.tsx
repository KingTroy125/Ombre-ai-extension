import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../lib/utils";

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const language = /language-(\w+)/.exec(className || "")?.[1];
  const code = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative my-2 overflow-hidden rounded-lg border border-border bg-[#0b0b0d]">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {copied ? <Check size={12} className="feather" /> : <Copy size={12} className="feather" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose-toqan text-[14px] leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          /* ── Code ─────────────────────────────────────────────── */
          code(props) {
            const { className, children, ...rest } = props as {
              className?: string;
              children?: React.ReactNode;
              node?: unknown;
            };
            const isBlock = /language-/.test(className || "") || String(children).includes("\n");
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code
                className="rounded bg-secondary px-1 py-0.5 text-[13px] text-[#c9c4ff]"
                {...rest}
              >
                {children}
              </code>
            );
          },

          /* ── Links ────────────────────────────────────────────── */
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
              >
                {children}
              </a>
            );
          },

          /* ── Lists ────────────────────────────────────────────── */
          ul({ children }) {
            return <ul className="my-1.5 list-disc space-y-0.5 pl-5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-1.5 list-decimal space-y-0.5 pl-5">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          /* ── Paragraphs ───────────────────────────────────────── */
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },

          /* ── Headings ─────────────────────────────────────────── */
          h1({ children }) {
            return <h1 className="mb-2 mt-3 text-[16px] font-semibold text-foreground">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="mb-2 mt-3 text-[15px] font-semibold text-foreground">{children}</h2>;
          },
          h3({ children }) {
            return (
              <h3 className="mb-1.5 mt-2.5 text-[13.5px] font-semibold text-foreground">
                {children}
              </h3>
            );
          },

          /* ── Horizontal rule (---) ────────────────────────────── */
          hr() {
            return <hr className="my-3 border-none border-t border-border opacity-50" />;
          },

          /* ── Blockquote (> …) ─────────────────────────────────── */
          // Used by the AI for email body copy — rendered as a clean
          // card-like block rather than a gutter quote so multi-line
          // emails read naturally.
          blockquote({ children }) {
            return (
              <blockquote className="my-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5 text-[13.5px] leading-relaxed text-foreground/90">
                {children}
              </blockquote>
            );
          },

          /* ── Emphasis ─────────────────────────────────────────── */
          strong({ children }) {
            return <strong className="font-semibold text-foreground">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-foreground/80">{children}</em>;
          },

          /* ── Tables ───────────────────────────────────────────── */
          table({ children }) {
            return (
              <div className="my-2 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-[13px]">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="border-b border-border bg-secondary px-2 py-1 font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="border-b border-border/60 px-2 py-1">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
