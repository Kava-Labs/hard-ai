import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

//  Mock for scrollHeight
Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  get: function () {
    //  Return a larger value when the textarea has content
    return this.value?.length > 0 ? 60 : 30;
  },
});

const onCancelClick = vi.fn();
const handleChatCompletion = vi.fn();

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resize textarea correctly after sending a message', () => {
    const wrapper = render(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={false}
      />,
    );

    const textarea = wrapper.getByPlaceholderText(
      'Ask anything...',
    ) as HTMLTextAreaElement;

    const styleSpy = vi.spyOn(textarea.style, 'height', 'set');

    fireEvent.change(textarea, {
      target: {
        value: 'Hello, this is a test message!',
      },
    });

    //  Initially the mocked-default, then updated
    expect(styleSpy).toHaveBeenNthCalledWith(1, '30px');
    expect(styleSpy).toHaveBeenNthCalledWith(2, 'min(60px, 60vh)');
    styleSpy.mockClear();

    const sendButton = wrapper.getByRole('button', { name: 'Send Chat' });
    fireEvent.click(sendButton);

    //  Reset to default height
    expect(styleSpy).toHaveBeenCalledWith('30px');
    expect(textarea.value).toBe('');

    styleSpy.mockRestore();
  });

  it('should disable the send button when input is empty', () => {
    const wrapper = render(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={false}
      />,
    );

    const sendButton = wrapper.getByRole('button', { name: 'Send Chat' });
    expect(sendButton).toBeDisabled();

    const textarea = wrapper.getByPlaceholderText('Ask anything...');

    fireEvent.change(textarea, { target: { value: 'Hello!' } });
    expect(sendButton).not.toBeDisabled();

    fireEvent.change(textarea, { target: { value: '' } });
    expect(sendButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: '        ' } });
    expect(sendButton).toBeDisabled();
  });

  it('textarea should be focused by default', () => {
    const wrapper = render(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={false}
      />,
    );

    const textarea = wrapper.getByPlaceholderText('Ask anything...');
    expect(textarea).toHaveFocus();
  });

  it('should call onSubmitMessage with the message when send button is clicked', () => {
    const wrapper = render(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={false}
      />,
    );

    const textarea = wrapper.getByPlaceholderText('Ask anything...');
    const testMessage = 'This is a test message';

    fireEvent.change(textarea, { target: { value: testMessage } });
    fireEvent.click(wrapper.getByRole('button', { name: 'Send Chat' }));

    expect(handleChatCompletion).toHaveBeenCalledTimes(1);
    expect(handleChatCompletion).toHaveBeenCalledWith([
      {
        role: 'user',
        content: testMessage,
      },
    ]);
  });

  it('should show cancel button when isRequesting is true', () => {
    const wrapper = render(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={true}
      />,
    );

    const cancelButton = wrapper.getByRole('button', { name: 'Cancel Chat' });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should call onCancelClick when cancel button is clicked (not handleChatCompletion)', () => {
    const wrapper = render(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={true}
      />,
    );

    expect(onCancelClick).toHaveBeenCalledTimes(0);

    const cancelButton = wrapper.getByRole('button', { name: 'Cancel Chat' });
    fireEvent.click(cancelButton);

    expect(onCancelClick).toHaveBeenCalledTimes(1);
  });

  it('should enable the cancel button even when input is empty', () => {
    const wrapper = render(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={true}
      />,
    );

    const cancelButton = wrapper.getByRole('button', { name: 'Cancel Chat' });
    expect(cancelButton).not.toBeDisabled();
  });

  it('should switch from send to cancel button when isRequesting changes', () => {
    const { rerender, getByRole } = render(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={false}
      />,
    );

    expect(getByRole('button', { name: 'Send Chat' })).toBeInTheDocument();

    rerender(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={true}
      />,
    );

    expect(getByRole('button', { name: 'Cancel Chat' })).toBeInTheDocument();
  });

  it('should not call handleChatCompletion when in requesting state', () => {
    const wrapper = render(
      <ChatInput
        onCancelClick={onCancelClick}
        handleChatCompletion={handleChatCompletion}
        isRequesting={true}
      />,
    );

    const textarea = wrapper.getByPlaceholderText('Ask anything...');
    const testMessage = 'This is a test message';

    fireEvent.change(textarea, { target: { value: testMessage } });

    expect(onCancelClick).toHaveBeenCalledTimes(0);

    //  Even with content, clicking the button should call onCancelClick not handleChatCompletion
    const cancelButton = wrapper.getByRole('button', { name: 'Cancel Chat' });
    fireEvent.click(cancelButton);

    expect(onCancelClick).toHaveBeenCalledTimes(1);
    expect(handleChatCompletion).not.toHaveBeenCalled();
  });
});
