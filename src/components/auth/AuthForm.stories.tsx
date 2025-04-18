import type { Meta, StoryObj } from '@storybook/react';
import { AuthForm } from './AuthForm';

const meta: Meta<typeof AuthForm> = {
  title: 'Components/AuthForm',
  component: AuthForm,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px] p-6 bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AuthForm>;

export const Login: Story = {
  args: {
    type: 'login',
  },
};

export const Register: Story = {
  args: {
    type: 'register',
  },
};

export const ResetPassword: Story = {
  args: {
    type: 'reset-password',
  },
}; 