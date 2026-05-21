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

  it('uses Consolas for inline code', () => {
    render(<MarkdownMessage content="输入 `pnpm dev`" />);

    expect(screen.getByText('pnpm dev')).toHaveStyle({ fontFamily: 'Consolas, monospace' });
  });
});
