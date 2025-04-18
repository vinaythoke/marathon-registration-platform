import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Label Text',
  },
};

export const Required: Story = {
  args: {
    children: 'Required Field',
    className: 'after:content-["*"] after:ml-0.5 after:text-red-500',
  },
};

export const WithHint: Story = {
  args: {
    children: (
      <div className="space-y-1">
        <span>Label with Hint</span>
        <span className="text-xs text-muted-foreground block">Optional field</span>
      </div>
    ),
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Label',
    className: 'opacity-50 cursor-not-allowed',
  },
}; 