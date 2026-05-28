import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TavernAvatar } from './tavern-avatar';

describe('TavernAvatar', () => {
  it('renders avatar image when avatarUrl is provided', () => {
    render(<TavernAvatar avatarUrl="https://example.com/avatar.png" nickname="阿北" />);

    expect(screen.getByAltText('阿北 的头像')).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('falls back to nickname initial when avatarUrl is missing', () => {
    render(<TavernAvatar nickname="阿北" />);

    expect(screen.getByText('阿')).toBeInTheDocument();
  });
});
