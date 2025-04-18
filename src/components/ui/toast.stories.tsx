import type { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastProvider, ToastViewport } from './toast';
import { Button } from './button';
import { useToast, Toaster } from '@/components/ui/use-toast';

const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "Scheduled: Catch up",
            description: "Friday, February 10, 2024 at 5:57 PM",
          });
        }}
      >
        Show Toast
      </Button>
      <Toaster />
    </>
  );
};

const meta: Meta<typeof Toast> = {
  title: 'UI/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <ToastViewport />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => <ToastDemo />,
};

export const Success: Story = {
  render: () => {
    const { toast } = useToast();
    return (
      <>
        <Button
          variant="outline"
          onClick={() => {
            toast({
              title: "Success!",
              description: "Your changes have been saved.",
              variant: 'default',
            });
          }}
        >
          Show Success Toast
        </Button>
        <Toaster />
      </>
    );
  },
};

export const Destructive: Story = {
  render: () => {
    const { toast } = useToast();
    return (
      <>
        <Button
          variant="outline"
          onClick={() => {
            toast({
              title: "Error!",
              description: "Something went wrong.",
              variant: 'destructive',
            });
          }}
        >
          Show Error Toast
        </Button>
        <Toaster />
      </>
    );
  },
}; 