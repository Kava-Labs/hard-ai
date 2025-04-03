import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatHistoryItem } from "./ChatHistoryItem";
import { ConversationHistory } from "../../types/conversationHistories";

describe("ChatHistoryItem Component", () => {
  const mockConversation: ConversationHistory = {
    id: "conv-2025-03-19-001",
    model: "gpt-4-turbo",
    title: "Test Conversation",
    lastSaved: Date.now(),
    tokensRemaining: 6453,
  };

  const mockProps = {
    conversation: mockConversation,
    onHistoryItemClick: vi.fn(),
    deleteConversation: vi.fn(),
    updateConversationTitle: vi.fn(),
    isSelected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render correctly with the given title", () => {
    render(<ChatHistoryItem {...mockProps} />);

    expect(screen.getByText("Test Conversation")).toBeInTheDocument();
  });

  it("should apply selected class when isSelected is true", () => {
    const { container } = render(
      <ChatHistoryItem {...mockProps} isSelected={true} />
    );

    expect(container.firstChild).toHaveClass(
      "_chatHistoryItem_59731c _selected_59731c"
    );
  });

  it("should call onHistoryItemClick when title is clicked", () => {
    render(<ChatHistoryItem {...mockProps} />);

    fireEvent.click(screen.getByText("Test Conversation"));

    expect(mockProps.onHistoryItemClick).toHaveBeenCalledTimes(1);
  });

  it("should open menu when menu button is clicked", () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    expect(screen.getByRole("button", { name: "Rename Title" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete Chat" })).toBeVisible();
  });

  it("should enter edit mode when rename button is clicked", () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    const renameButton = screen.getByRole("button", { name: "Rename Title" });
    fireEvent.click(renameButton);

    const input = screen.getByLabelText("Edit Title Input");
    expect(input).toBeVisible();
    expect(input).toHaveValue("Test Conversation");
  });

  it("should update input value as user types", () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    const renameButton = screen.getByRole("button", { name: "Rename Title" });
    fireEvent.click(renameButton);

    const input = screen.getByLabelText("Edit Title Input");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "Updated Title" } });

    expect(input).toHaveValue("Updated Title");
  });

  it("should save title when Enter key is pressed", () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    const renameButton = screen.getByRole("button", { name: "Rename Title" });
    fireEvent.click(renameButton);

    const input = screen.getByLabelText("Edit Title Input");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "Updated Title" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockProps.updateConversationTitle).toHaveBeenCalledWith(
      "conv-2025-03-19-001",
      "Updated Title"
    );
  });

  it("should not save empty title but revert to original", () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    const renameButton = screen.getByRole("button", { name: "Rename Title" });
    fireEvent.click(renameButton);

    const input = screen.getByLabelText("Edit Title Input");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockProps.updateConversationTitle).not.toHaveBeenCalled();
    expect(screen.getByText("Test Conversation")).toBeInTheDocument();
  });

  it("should cancel editing when Escape key is pressed", () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    const renameButton = screen.getByRole("button", { name: "Rename Title" });
    fireEvent.click(renameButton);

    const input = screen.getByLabelText("Edit Title Input");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "Updated Title" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(mockProps.updateConversationTitle).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Edit Title Input")).not.toBeInTheDocument();
    expect(screen.getByText("Test Conversation")).toBeInTheDocument();
  });

  it("should delete conversation when delete button is clicked", () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    const deleteButton = screen.getByRole("button", { name: "Delete Chat" });
    fireEvent.click(deleteButton);

    expect(mockProps.deleteConversation).toHaveBeenCalledWith(
      "conv-2025-03-19-001"
    );
  });

  it("should not update title if the trimmed value is the same as the original", () => {
    render(<ChatHistoryItem {...mockProps} />);

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    const renameButton = screen.getByRole("button", { name: "Rename Title" });
    fireEvent.click(renameButton);

    const input = screen.getByLabelText("Edit Title Input");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "  Test Conversation  " } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockProps.updateConversationTitle).not.toHaveBeenCalled();
  });

  it("should save title when clicking outside while in edit mode", () => {
    render(
      <div>
        <div data-testid="outside-element">Outside Element</div>
        <ChatHistoryItem {...mockProps} />
      </div>
    );

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    const renameButton = screen.getByRole("button", { name: "Rename Title" });
    fireEvent.click(renameButton);

    const input = screen.getByLabelText("Edit Title Input");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, {
      target: { value: "New Title from Outside Click" },
    });

    fireEvent.mouseDown(screen.getByTestId("outside-element"));

    expect(mockProps.updateConversationTitle).toHaveBeenCalledWith(
      "conv-2025-03-19-001",
      "New Title from Outside Click"
    );
  });
  it("should handle data-menu-button elements correctly in click outside handler", () => {
    render(
      <div>
        <button data-testid="menu-button-element" data-menu-button="true">
          Menu Button
        </button>
        <ChatHistoryItem {...mockProps} />
      </div>
    );

    const menuButton = screen.getByRole("button", { name: "Chat Options" });
    fireEvent.click(menuButton);

    const renameButton = screen.getByRole("button", { name: "Rename Title" });
    fireEvent.click(renameButton);

    const input = screen.getByLabelText("Edit Title Input");
    fireEvent.change(input, { target: { value: "" } });

    fireEvent.click(screen.getByTestId("menu-button-element"));

    expect(input).toBeInTheDocument();
    expect(mockProps.updateConversationTitle).not.toHaveBeenCalled();
  });
});
