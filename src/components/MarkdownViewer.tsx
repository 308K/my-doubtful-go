// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, zero-dependency Markdown parser tailored for financial tables,
 * executive reports, blockquotes, lists, and code blocks.
 */
export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = "",
}) => {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return null;
    const headerRow = tableRows[0];
    if (!headerRow) return null;
    const bodyRows = tableRows.slice(1).filter((r) => !r.every((c) => c.match(/^[:\-\s]+$/)));

    const el = (
      <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-xs text-left text-zinc-700 dark:text-zinc-300">
          <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold border-b border-zinc-200 dark:border-zinc-700">
            <tr>
              {headerRow.map((cell, idx) => (
                <th key={idx} className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 last:border-0 font-medium">
                  {formatInline(cell.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900/40">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 last:border-0">
                    {formatInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
    return el;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const line = rawLine;
    const trimmed = line.trim();

    // Markdown Table Row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      inTable = true;
      continue;
    } else if (inTable) {
      elements.push(flushTable(i));
    }

    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-3 mb-1">
          {formatInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
          {formatInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-zinc-950 dark:text-white mt-4 mb-2">
          {formatInline(trimmed.slice(2))}
        </h2>
      );
    } else if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-3 my-2 text-xs italic text-zinc-600 dark:text-zinc-400"
        >
          {formatInline(trimmed.slice(2))}
        </blockquote>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-0.5 text-xs text-zinc-700 dark:text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-1.5 shrink-0" />
          <span className="flex-1 leading-relaxed">{formatInline(trimmed.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)$/);
      elements.push(
        <div key={`oli-${i}`} className="flex items-start gap-2 my-0.5 text-xs text-zinc-700 dark:text-zinc-300">
          <span className="font-mono text-zinc-400 dark:text-zinc-500 text-[11px] shrink-0">{match?.[1]}.</span>
          <span className="flex-1 leading-relaxed">{formatInline(match?.[2] || "")}</span>
        </div>
      );
    } else if (trimmed === "---") {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-zinc-200 dark:border-zinc-800" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 my-1">
          {formatInline(line)}
        </p>
      );
    }
  }

  if (inTable) {
    elements.push(flushTable(lines.length));
  }

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
};

/** Formats bold, code, and highlight inline tokens */
function formatInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split by bold (**text**)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-zinc-950 dark:text-zinc-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
