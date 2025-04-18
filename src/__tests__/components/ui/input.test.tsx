import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  test('renders with correct placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  test('renders with correct type', () => {
    render(<Input type="password" data-testid="password-input" />);
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
  });

  test('handles onChange correctly', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} data-testid="test-input" />);
    
    const input = screen.getByTestId('test-input');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('can be disabled', () => {
    render(<Input disabled data-testid="disabled-input" />);
    expect(screen.getByTestId('disabled-input')).toBeDisabled();
  });

  test('applies custom class name', () => {
    render(<Input className="custom-class" data-testid="custom-input" />);
    expect(screen.getByTestId('custom-input')).toHaveClass('custom-class');
  });

  test('defaults to type="text" if not specified', () => {
    render(<Input data-testid="default-input" />);
    expect(screen.getByTestId('default-input')).toHaveAttribute('type', 'text');
  });

  test('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} data-testid="ref-input" />);
    
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('INPUT');
  });
}); 