'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownProps {
  content: string;
  role?: 'user' | 'assistant';
}

export const Markdown = ({ content, role = 'assistant' }: MarkdownProps) => {
  return (
    <div className={`prose prose-sm max-w-none prose-pre:p-0 ${
      role === 'user' ? 'prose-invert' : ''
    }`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: any) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter
                {...rest}
                PreTag="div"
                language={match[1]}
                style={oneLight}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code {...rest} className={`${className || ''} bg-[#F0F0F0] px-1.5 py-0.5 rounded text-sm`}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
