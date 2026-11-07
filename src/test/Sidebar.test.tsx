import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "../components/Sidebar";
import type { Conversation } from "../lib/types";

describe("Sidebar component", () => {
  const mockConversations: Conversation[] = [
    {
      id: "conv-1",
      title: "Research on AlphaFold",
      messages: [],
      createdAt: 1000,
      updatedAt: 2000,
    },
    {
      id: "conv-2",
      title: "Bug investigation notes",
      messages: [],
      createdAt: 3000,
      updatedAt: 4000,
    },
  ];

  const defaultProps = {
    conversations: mockConversations,
    activeId: "conv-1",
    onSelect: vi.fn(),
    onNew: vi.fn(),
    onDelete: vi.fn(),
    onOpenNotes: vi.fn(),
    onOpenSettings: vi.fn(),
    collapsed: false,
    onToggleCollapse: vi.fn(),
    activeView: "chat" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Happy path", () => {
    it("renders workspace information, navigation buttons, and conversation titles", () => {
      render(<Sidebar {...defaultProps} />);

      expect(screen.getByText("Ombre AI")).toBeInTheDocument();
      expect(screen.getByText("New chat")).toBeInTheDocument();
      expect(screen.getByText("Research on AlphaFold")).toBeInTheDocument();
      expect(screen.getByText("Bug investigation notes")).toBeInTheDocument();
      expect(screen.getByText("Notes")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("calls onSelect and onToggleCollapse when a conversation is chosen", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);

      const conversationButton = screen.getByRole("button", {
        name: "Bug investigation notes",
      });
      await user.click(conversationButton);

      expect(defaultProps.onSelect).toHaveBeenCalledWith("conv-2");
      expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it("calls onNew and onToggleCollapse when New chat is clicked", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "New chat" }));

      expect(defaultProps.onNew).toHaveBeenCalledTimes(1);
      expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it("calls onOpenNotes and closes drawer when Notes is clicked", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Notes" }));

      expect(defaultProps.onOpenNotes).toHaveBeenCalledTimes(1);
      expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it("calls onOpenSettings and closes drawer when Settings is clicked", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Settings" }));

      expect(defaultProps.onOpenSettings).toHaveBeenCalledTimes(1);
      expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it("calls onDelete when the delete button is clicked without triggering onSelect", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);

      const deleteButton = screen.getByRole("button", {
        name: "Delete Research on AlphaFold",
      });
      await user.click(deleteButton);

      expect(defaultProps.onDelete).toHaveBeenCalledWith("conv-1");
      expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("renders empty state message when no conversations exist", () => {
      render(<Sidebar {...defaultProps} conversations={[]} />);

      expect(screen.getByText("No conversations yet.")).toBeInTheDocument();
    });

    it("filters conversations by search query", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);

      const searchOpenButton = screen.getByRole("button", {
        name: "Search chats",
      });
      await user.click(searchOpenButton);

      const searchInput = screen.getByRole("textbox", {
        name: "Search chat history",
      });
      await user.type(searchInput, "AlphaFold");

      expect(screen.getByText("Research on AlphaFold")).toBeInTheDocument();
      expect(
        screen.queryByText("Bug investigation notes"),
      ).not.toBeInTheDocument();
    });

    it("shows no chats found message when query has no matches", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: "Search chats" }));

      const searchInput = screen.getByRole("textbox", {
        name: "Search chat history",
      });
      await user.type(searchInput, "Nonexistent topic");

      expect(screen.getByText("No chats found")).toBeInTheDocument();
    });
  });

  describe("State transitions and interactions", () => {
    it("opens opener button when collapsed is true", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} collapsed={true} />);

      const openButton = screen.getByRole("button", { name: "Open sidebar" });
      expect(openButton).toBeInTheDocument();

      await user.click(openButton);
      expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    it("toggles workspace menu dropdown when workspace button is clicked", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} />);

      const workspaceTrigger = screen.getByRole("button", {
        name: /Ombre AI/i,
      });
      await user.click(workspaceTrigger);

      expect(screen.getByText("New workspace")).toBeInTheDocument();
      expect(screen.getByText("Workspace settings")).toBeInTheDocument();
      expect(screen.getByText("Invite team members")).toBeInTheDocument();
      expect(screen.getByText("Sign out")).toBeInTheDocument();
    });

    it("closes sidebar drawer when Escape key is pressed", async () => {
      const user = userEvent.setup();
      render(<Sidebar {...defaultProps} collapsed={false} />);

      await user.keyboard("{Escape}");
      expect(defaultProps.onToggleCollapse).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("exposes proper accessible names and ARIA attributes", () => {
      render(<Sidebar {...defaultProps} />);

      expect(
        screen.getByRole("complementary", { name: "Workspace navigation" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Close sidebar" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Search chats" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Delete Research on AlphaFold" }),
      ).toBeInTheDocument();
    });
  });
});
