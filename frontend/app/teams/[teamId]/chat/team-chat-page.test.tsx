import { render, screen, fireEvent, waitFor } from "@testing-library/react";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://test";

const TeamChatPage = require("./team-chat-page").default;

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

function createFakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) =>
        key.toLowerCase() === "content-type" ? "application/json" : null,
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe("TeamChatPage integration-style tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("token", createFakeJwt({ sub: "user-123" }));
  });

  it("loads messages and resolves sender names through the real helper chain", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "http://test/api/teams/team-123/chat/messages") {
        return jsonResponse([
          {
            messageId: "msg-1",
            senderId: "chat-user-a",
            content: "Hello team!",
            sendDate: "2026-04-22T10:00:00Z",
          },
          {
            messageId: "msg-2",
            senderId: "chat-user-b",
            content: "How is everyone?",
            sendDate: "2026-04-22T10:05:00Z",
          },
        ]);
      }

      if (url === "http://test/api/members/info?ids=chat-user-a,chat-user-b") {
        expect((init?.headers as Record<string, string>).Authorization).toContain("Bearer");
        return jsonResponse([
          { memberId: "chat-user-a", name: "Alice" },
          { memberId: "chat-user-b", name: "Bob" },
        ]);
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    });

    render(<TeamChatPage teamId="team-123" />);

    expect(screen.getByText(/loading messages/i)).toBeInTheDocument();

    expect(await screen.findByText("Hello team!")).toBeInTheDocument();
    expect(await screen.findByText("How is everyone?")).toBeInTheDocument();
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(await screen.findByText("Bob")).toBeInTheDocument();

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("sends a message and resolves the new sender name through the real helper chain", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "http://test/api/teams/team-123/chat/messages" && (!init?.method || init.method === "GET")) {
        return jsonResponse([]);
      }

      if (url === "http://test/api/teams/team-123/chat/messages" && init?.method === "POST") {
        return jsonResponse({
          messageId: "msg-new",
          senderId: "chat-user-c",
          content: "Test integration message",
          sendDate: "2026-04-23T11:00:00Z",
        });
      }

      if (url === "http://test/api/members/info?ids=chat-user-c") {
        return jsonResponse([{ memberId: "chat-user-c", name: "Charlie" }]);
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    });

    render(<TeamChatPage teamId="team-123" />);

    await waitFor(() => {
      expect(screen.queryByText(/loading messages/i)).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/write a message/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test integration message" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("Test integration message")).toBeInTheDocument();
    expect(await screen.findByText("Charlie")).toBeInTheDocument();
    expect(input.value).toBe("");

    expect(mockFetch).toHaveBeenCalledTimes(3);

    const [postUrl, postOptions] = mockFetch.mock.calls[1];
    expect(String(postUrl)).toBe("http://test/api/teams/team-123/chat/messages");
    expect((postOptions as RequestInit).method).toBe("POST");
    expect((postOptions as RequestInit).body).toBe(
      JSON.stringify({ content: "Test integration message" })
    );
  });

  it("does not call the backend when the real getToken returns no token", async () => {
    localStorage.clear();
    sessionStorage.clear();

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<TeamChatPage teamId="team-123" />);

    await waitFor(() => {
      expect(screen.queryByText(/loading messages/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("handles a server error on load without crashing the page", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Server error",
    });

    render(<TeamChatPage teamId="team-123" />);

    await waitFor(() => {
      expect(screen.queryByText(/loading messages/i)).not.toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: /team chat/i })).toBeInTheDocument();
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});