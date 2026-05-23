import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownMessage } from './markdown-message';

describe('MarkdownMessage', () => {
  it('renders headings instead of removing them', () => {
    render(<MarkdownMessage content="# 小标题" />);

    expect(screen.getByRole('heading', { level: 1, name: '小标题' })).toBeInTheDocument();
  });

  it('renders strong text with visible font weight styling', () => {
    render(<MarkdownMessage content="这是 **重点**" />);

    expect(screen.getByText('重点').tagName).toBe('STRONG');
    expect(screen.getByText('重点')).toHaveClass('font-semibold');
  });

  it('renders unordered list bullets with spacing', () => {
    render(<MarkdownMessage content={'- 第一杯\n- 第二杯'} />);

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(list).toHaveClass('list-disc');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('preserves plain newlines inside a message paragraph', () => {
    render(<MarkdownMessage content={'第一行\n第二行'} />);

    expect(screen.getByText(/第一行/).tagName).toBe('P');
    expect(screen.getByText(/第一行/)).toHaveClass('whitespace-pre-wrap');
  });

  it('renders tavern markdown with the warm palette classes', () => {
    render(<MarkdownMessage content={'[链接](https://example.com)\n\n`code`\n\n> 引文'} />);

    expect(screen.getByRole('link', { name: '链接' })).toHaveClass('text-amber-100');
    expect(screen.getByText('code')).toHaveClass('bg-[rgba(30,20,14,0.72)]');
    expect(screen.getByText('引文').closest('blockquote')).toHaveClass('border-l-2');
  });
});
