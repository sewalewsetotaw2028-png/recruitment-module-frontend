import React, { useRef } from 'react';

interface RichTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  monospace?: boolean;
}

type ToolbarButton = {
  title: string;
  icon: string;
  action: () => void;
};

export const RichTextField: React.FC<RichTextFieldProps> = ({
  value,
  onChange,
  placeholder,
  rows = 6,
  className = '',
  monospace = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (before: string, after = before) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);

    // Toggle: if already wrapped, unwrap
    const alreadyWrapped =
      value.slice(start - before.length, start) === before &&
      value.slice(end, end + after.length) === after;

    let next: string;
    let newStart: number;
    let newEnd: number;

    if (alreadyWrapped) {
      next =
        value.slice(0, start - before.length) +
        selected +
        value.slice(end + after.length);
      newStart = start - before.length;
      newEnd = end - before.length;
    } else {
      next = value.slice(0, start) + before + selected + after + value.slice(end);
      newStart = start + before.length;
      newEnd = end + before.length;
    }

    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newStart, newEnd);
    });
  };

  const prefixLines = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lines = value.split('\n');
    let charPos = 0;
    let startLine = 0;
    let endLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineEnd = charPos + lines[i].length;
      if (charPos <= start && start <= lineEnd) startLine = i;
      if (charPos <= end && end <= lineEnd) endLine = i;
      charPos += lines[i].length + 1;
    }

    for (let i = startLine; i <= endLine; i++) {
      lines[i] = lines[i].startsWith(prefix)
        ? lines[i].slice(prefix.length)
        : prefix + lines[i];
    }

    onChange(lines.join('\n'));
    requestAnimationFrame(() => ta.focus());
  };

  const insertHorizontalRule = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const next = value.slice(0, pos) + '\n---\n' + value.slice(pos);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(pos + 5, pos + 5);
    });
  };

  const toolbarGroups: ToolbarButton[][] = [
    [
      { title: 'Bold (Ctrl+B)', icon: 'format_bold', action: () => wrapSelection('**') },
      { title: 'Italic (Ctrl+I)', icon: 'format_italic', action: () => wrapSelection('_') },
      { title: 'Underline', icon: 'format_underlined', action: () => wrapSelection('__') },
    ],
    [
      { title: 'Bullet list', icon: 'format_list_bulleted', action: () => prefixLines('• ') },
      { title: 'Numbered list', icon: 'format_list_numbered', action: () => prefixLines('1. ') },
      { title: 'Checklist', icon: 'check_box', action: () => prefixLines('☐ ') },
    ],
    [
      { title: 'Heading', icon: 'title', action: () => prefixLines('## ') },
      { title: 'Quote', icon: 'format_quote', action: () => prefixLines('> ') },
      { title: 'Divider', icon: 'horizontal_rule', action: insertHorizontalRule },
    ],
  ];

  // Character count
  const charCount = value.length;

  return (
    <div className={`rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200">
        {toolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <span className="w-px h-5 bg-slate-200 mx-1 shrink-0" />
            )}
            <div className="flex items-center gap-0.5">
              {group.map((btn) => (
                <button
                  key={btn.title}
                  type="button"
                  title={btn.title}
                  onMouseDown={(e) => {
                    // Prevent textarea losing focus
                    e.preventDefault();
                    btn.action();
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 active:bg-slate-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px] leading-none block">
                    {btn.icon}
                  </span>
                </button>
              ))}
            </div>
          </React.Fragment>
        ))}

        {/* Right side: char count */}
        <span className="ml-auto text-[11px] font-medium text-slate-400 tabular-nums pr-1">
          {charCount.toLocaleString()} chars
        </span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck
        className={`
          w-full px-4 py-3 text-sm text-slate-800 leading-relaxed
          bg-white border-0 outline-none resize-y
          placeholder:text-slate-400
          ${monospace ? 'font-mono text-xs' : 'font-normal'}
        `}
        style={{ minHeight: `${rows * 1.75}rem` }}
      />

      {/* Footer hint */}
      <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <span className="material-symbols-outlined text-[13px] text-slate-400">info</span>
        <span className="text-[11px] text-slate-400">
          Supports **bold**, _italic_, • bullet lists, and ## headings
        </span>
      </div>
    </div>
  );
};
