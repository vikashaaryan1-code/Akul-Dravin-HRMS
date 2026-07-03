import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThreeDGlassCard } from '@/components/ui/ThreeDGlassCard';

describe('ThreeDGlassCard Component', () => {
  it('renders children correctly', () => {
    render(
      <ThreeDGlassCard>
        <div data-testid="3d-child">3D Content</div>
      </ThreeDGlassCard>
    );
    expect(screen.getByTestId('3d-child')).toBeInTheDocument();
    expect(screen.getByText('3D Content')).toBeInTheDocument();
  });

  it('renders title and description when provided', () => {
    render(
      <ThreeDGlassCard title="My 3D Card" description="This is a cinematic card.">
        Content
      </ThreeDGlassCard>
    );
    expect(screen.getByText('My 3D Card')).toBeInTheDocument();
    expect(screen.getByText('This is a cinematic card.')).toBeInTheDocument();
  });

  it('applies custom classNames', () => {
    const { container } = render(
      <ThreeDGlassCard className="custom-3d-class">
        Content
      </ThreeDGlassCard>
    );
    // The outermost wrapper uses perspective, but the inner grouping handles the class injection in many cinematic setups.
    // The component forwards standard classes to its wrapper.
    expect(container.firstChild).toHaveClass('custom-3d-class');
  });
});
