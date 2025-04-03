import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import { SideBar, SideBarProps } from "./SideBar";
import { useIsMobileLayout } from "../../hooks/useIsMobileLayout";

vi.mock("../../hooks/useIsMobileLayout");

const sideBarLogo = <img alt="mock sideBar" />;

describe("SideBar", () => {
  const mockProps: SideBarProps = {
    conversationHistories: {},
    onSelectConversation: vi.fn(),
    activeConversationId: "test-id",
    onDeleteConversation: vi.fn(),
    onUpdateConversationTitle: vi.fn(),
    onCloseClick: vi.fn(),
    onOpenSearchModal: vi.fn(),
    isSideBarOpen: false,
    SideBarLogo: sideBarLogo,
  };

  const mockConversationHistories = {
    "123": {
      id: "123",
      model: "gpt-4o",
      title: "First title",
      lastSaved: Date.now(), //  will trigger "Today"
      tokensRemaining: 6453,
    },
    "456": {
      id: "456",
      model: "gpt-4o",
      title: "Second title",
      lastSaved: 123, //  will trigger "Older"
      tokensRemaining: 6453,
    },
    "789": {
      id: "789",
      model: "gpt-4o",
      title: "Third title",
      lastSaved: 123,
      tokensRemaining: 6453,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders Sidebar in mobile layout when sidebar is open", () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(true);

    render(<SideBar {...mockProps} isSideBarOpen={true} />);

    expect(screen.getByLabelText("Close Mobile Menu"));
  });

  test("renders Sidebar in desktop layout when sidebar is open", () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(false);

    render(<SideBar {...mockProps} />);

    expect(screen.getByLabelText("Close Desktop Menu"));
  });

  test("renders the logo and ChatHistory component", () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(true);

    render(
      <SideBar
        {...mockProps}
        conversationHistories={mockConversationHistories}
      />
    );

    expect(
      screen.getByRole("img", { name: "mock sideBar" })
    ).toBeInTheDocument();
    //  Titles
    expect(screen.getByText("First title")).toBeInTheDocument();
    expect(screen.getByText("Second title")).toBeInTheDocument();
    expect(screen.getByText("Third title")).toBeInTheDocument();
    //  Time group labels
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Older")).toBeInTheDocument();
  });

  test("calls onCloseClick when close button is clicked", () => {
    vi.mocked(useIsMobileLayout).mockReturnValue(true);

    render(<SideBar {...mockProps} />);

    screen.getByLabelText("Close Mobile Menu").click();
    expect(mockProps.onCloseClick).toHaveBeenCalledTimes(1);
  });

  test("calls onOpenSearchModal when search button is clicked", () => {
    render(
      <SideBar
        {...mockProps}
        conversationHistories={mockConversationHistories}
      />
    );

    expect(mockProps.onOpenSearchModal).toHaveBeenCalledTimes(0);

    const searchButton = screen.getByRole("button", { name: "Search History" });
    fireEvent.click(searchButton);

    expect(mockProps.onOpenSearchModal).toHaveBeenCalledTimes(1);
  });

  test("does not call onOpenSearchModal when search button is clicked if user has no history", () => {
    render(<SideBar {...mockProps} conversationHistories={{}} />);

    const searchButton = screen.getByRole("button", { name: "Search History" });
    fireEvent.click(searchButton);

    expect(searchButton).toBeDisabled();
    expect(mockProps.onOpenSearchModal).toHaveBeenCalledTimes(0);
  });
});
