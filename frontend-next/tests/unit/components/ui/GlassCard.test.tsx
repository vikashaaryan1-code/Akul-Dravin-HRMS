import React from 'react';
import { render, screen } from '@testing-library/react';
import { GlassCard } from '@/components/ui/GlassCard';

describe('GlassCard Component', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div data-testid="child">Test Child</div>
      </GlassCard>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <GlassCard className="custom-test-class">
        Content
      </GlassCard>
    );
    // Since GlassCard merges classNames, we expect 'custom-test-class' to be present.
    expect(container.firstChild).toHaveClass('custom-test-class');
  });

  it('renders with default glassmorphism styles', () => {
    const { container } = render(
      <GlassCard>
        Content
      </GlassCard>
    );
    expect(container.firstChild).toHaveClass('bg-white/10', 'backdrop-blur-md', 'border-white/20');
  });
});
