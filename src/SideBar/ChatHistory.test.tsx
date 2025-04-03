import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatHistory } from "./ChatHistory";
import { ConversationHistories } from "../../types/conversationHistories";

describe("ChatHistory Component", () => {
  const mockOnSelectConversation = vi.fn();
  const mockOnDeleteConversation = vi.fn();
  const mockOnUpdateConversationTitle = vi.fn();

  const mockProps = {
    onSelectConversation: mockOnSelectConversation,
    onDeleteConversation: mockOnDeleteConversation,
    onUpdateConversationTitle: mockOnUpdateConversationTitle,
  };

  const mockHistories: ConversationHistories = {
    "conv-today-1": {
      id: "conv-today-1",
      model: "gpt-4-turbo",
      title: "First Today Conversation",
      lastSaved: Date.now(),
      tokensRemaining: 6000,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display empty chat history when no conversations exist", () => {
    render(
      <ChatHistory
        chatHistories={{}}
        activeConversationId={"123"}
        {...mockProps}
      />
    );

    expect(screen.getByText("Start a new chat to begin")).toBeInTheDocument();
  });

  it("should call onSelectConversation with correct ID when conversation is clicked", () => {
    render(
      <ChatHistory
        chatHistories={mockHistories}
        activeConversationId={"123"}
        {...mockProps}
      />
    );

    fireEvent.click(screen.getByText("First Today Conversation"));
    expect(mockOnSelectConversation).toHaveBeenCalledWith("conv-today-1");
  });

  it("should render conversations within their proper time groups", () => {
    const multipleHistories: ConversationHistories = {
      ...mockHistories,
      "conv-today-2": {
        id: "conv-today-2",
        model: "gpt-4-turbo",
        title: "Second Today Conversation",
        lastSaved: Date.now() - 3600000, // 1 hour ago
        tokensRemaining: 6000,
      },
      "conv-yesterday": {
        id: "conv-yesterday",
        model: "claude-3-opus",
        title: "Yesterday Conversation",
        lastSaved: Date.now() - 86400000, // 24 hours ago
        tokensRemaining: 5000,
      },
    };

    render(
      <ChatHistory
        chatHistories={multipleHistories}
        activeConversationId={"123"}
        {...mockProps}
      />
    );

    //  Get an array of the elements that match either the expected time labels or titles
    //  Verify that they are collected in the expected order (i.e. grouped correctly)
    const textToMatch =
      /Today|Yesterday|First Today Conversation|Second Today Conversation|Yesterday Conversation/;
    expect(screen.getAllByText(textToMatch)[0].textContent).toBe("Today");
    expect(screen.getAllByText(textToMatch)[1].textContent).toBe(
      "First Today Conversation"
    );
    expect(screen.getAllByText(textToMatch)[2].textContent).toBe(
      "Second Today Conversation"
    );
    expect(screen.getAllByText(textToMatch)[3].textContent).toBe("Yesterday");
    expect(screen.getAllByText(textToMatch)[4].textContent).toBe(
      "Yesterday Conversation"
    );
  });

  it("clicking delete button calls onDelete with correct id", async () => {
    render(
      <ChatHistory
        chatHistories={mockHistories}
        activeConversationId={"123"}
        {...mockProps}
      />
    );

    fireEvent.click(screen.getByLabelText("Chat Options"));
    fireEvent.click(screen.getByRole("button", { name: "Delete Chat" }));

    expect(mockProps.onDeleteConversation).toHaveBeenCalledWith("conv-today-1");
  });
  it("clicking rename button opens an editable input", async () => {
    render(
      <ChatHistory
        chatHistories={mockHistories}
        activeConversationId={"123"}
        {...mockProps}
      />
    );

    expect(screen.getByText("First Today Conversation")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Chat Options"));

    //  Click rename, which changes its button text to cancel
    const renameButton = screen.getByLabelText("Rename Title");
    fireEvent.click(renameButton);

    const editInput = screen.getByRole("textbox", {
      name: "Edit Title Input",
    });
    const cancelButton = screen.getByLabelText("Cancel Rename Title");
    const deleteButton = screen.getByLabelText("Delete Chat");

    expect(editInput).toBeInTheDocument();
    expect(editInput).toBeEnabled();
    expect(cancelButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
    expect(screen.queryByLabelText("Rename Title")).not.toBeInTheDocument();

    //  Click cancel to close editing mode
    fireEvent.click(cancelButton);

    expect(renameButton).toBeInTheDocument();

    //  Click icon to return to base view
    fireEvent.click(screen.getByLabelText("Chat Options"));

    expect(editInput).not.toBeInTheDocument();
  });
});
