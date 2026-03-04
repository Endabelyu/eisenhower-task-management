import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackForm } from './FeedbackForm';
import { LanguageProvider } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock ResizeObserver for radix components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('FeedbackForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <FeedbackForm />
        <Toaster />
      </LanguageProvider>
    );
  };

  it('renders the feedback form correctly', () => {
    renderComponent();
    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
  });

  it('submits feedback successfully using supabase edge function', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.functions.invoke as any).mockResolvedValueOnce({ data: null, error: null });

    renderComponent();
    
    // Type in the email field
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'test1@example.com' } });

    // Type in the message field
    const textarea = screen.getByRole('textbox', { name: /Message|Pesan/i });
    fireEvent.change(textarea, { target: { value: 'This is great!' } });

    // Click submit button
    const submitButton = screen.getByText('Send Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-feedback', {
        body: { 
          type: 'feedback', 
          message: 'This is great!', 
          email: 'test1@example.com',
          resendApiKey: undefined,
          personalEmail: undefined
        },
      });
      // A toast should implicitly appear (mocked inside components or tested by the toaster logic)
    });
  });

  it('submits feedback successfully with an email address included', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.functions.invoke as any).mockResolvedValueOnce({ data: null, error: null });

    renderComponent();
    
    // Type in the email field
    // Note: the component renders Label + Input with `type="email"`, we can query by type or text label.
    // However, finding the exact input container might need precise query, fallback to querying by placeholder/id context
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Type in the message field
    const textarea = screen.getByRole('textbox', { name: /Message|Pesan/i });
    fireEvent.change(textarea, { target: { value: 'This is great!' } });

    // Click submit button
    const submitButton = screen.getByText('Send Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('send-feedback', {
        body: { type: 'feedback', message: 'This is great!', email: 'test@example.com' },
      });
    });
  });

  it('disables submit button if message is empty', () => {
    renderComponent();
    const submitButton = screen.getByRole('button', { name: /Send Feedback/i });
    expect(submitButton).toBeDisabled();
  });
});
