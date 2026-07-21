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
          ul({ children }) {
            return <ul className="my-1.5 list-disc space-y-1 pl-5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-1.5 list-decimal space-y-1 pl-5">{children}</ol>;
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="mb-2 mt-3 text-[16px] font-semibold">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="mb-2 mt-3 text-[15px] font-semibold">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="mb-1.5 mt-2 text-[14px] font-semibold">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-2 border-l-2 border-primary/50 pl-3 text-muted-foreground">
                {children}
              </blockquote>
            );
          },
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
