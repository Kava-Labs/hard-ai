import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

vi.mock('./ChatInput.module.css', () => ({
  default: {
    controls: 'mock-controls',
    inputContainer: 'mock-inputContainer',
    input: 'mock-input',
    sendChatButton: 'mock-sendChatButton',
    importantInfo: 'mock-importantInfo',
  },
}));

describe('ChatInput', () => {
  const setHasMessages = vi.fn()
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resize textarea correctly after sending a message', () => {
    const wrapper = render(<ChatInput setHasMessages={setHasMessages} />);

    const textarea = wrapper.getByPlaceholderText(
      'Ask anything...',
    ) as HTMLTextAreaElement;

    const styleSpy = vi.spyOn(textarea.style, 'height', 'set');

    fireEvent.change(textarea, {
      target: {
        value: 'Hello, this is a test message!',
      },
    });

    //  Verify the textarea height was set accordingly
    expect(styleSpy).toHaveBeenCalledWith('30px');
    //  Adjust to scrollHeight
    expect(styleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^min\(\d+px, 60vh\)$/),
    );

    const sendButton = wrapper.getByRole('button', { name: 'Send Chat' });

    fireEvent.click(sendButton);

    expect(styleSpy).toHaveBeenCalledWith('30px');

    styleSpy.mockRestore();
  });

  it('should disable the send button when input is empty', () => {
    const wrapper = render(<ChatInput setHasMessages={setHasMessages} />);

    const sendButton = wrapper.getByRole('button', { name: 'Send Chat' });

    expect(sendButton).toBeDisabled();

    const textarea = wrapper.getByPlaceholderText('Ask anything...');

    fireEvent.change(textarea, { target: { value: 'Hello!' } });

    expect(sendButton).not.toBeDisabled();

    fireEvent.change(textarea, { target: { value: '' } });

    expect(sendButton).toBeDisabled();
  });

  it('textarea should be focused by default', () => {
    const wrapper = render(<ChatInput setHasMessages={setHasMessages} />);

    const textarea = wrapper.getByPlaceholderText('Ask anything...');
    expect(textarea).toHaveFocus();
  });
});
