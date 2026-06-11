// app/habits/[habitId]/leaderboard/page.integration.test.tsx

import { render, screen, waitFor } from "@testing-library/react";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://test";

jest.mock("next/navigation", () => ({
  useParams: () => ({
    habitId: "habit-1",
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock("framer-motion", () => {
  const React = require("react");

  const cleanProps = (props: Record<string, unknown>) => {
    const {
      whileHover,
      whileTap,
      layout,
      initial,
      animate,
      exit,
      transition,
      variants,
      ...rest
    } = props;

    return rest;
  };

  const MockMotionComponent = React.forwardRef(
    (
      { children, ...props }: React.PropsWithChildren<Record<string, unknown>>,
      ref: React.Ref<HTMLElement>
    ) => React.createElement("div", { ...cleanProps(props), ref }, children)
  );

  return {
    motion: new Proxy({}, { get: () => MockMotionComponent }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock("../../../notifications/NotificationDropdown", () => {
  return function MockNotificationDropdown() {
    return <div data-testid="notification-dropdown">Notifications</div>;
  };
});

const LeaderboardPage = require("./page").default;

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

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

function textResponse(text: string, status = 500) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) =>
        key.toLowerCase() === "content-type" ? "text/plain" : null,
    },
    json: async () => {
      throw new Error("not json");
    },
    text: async () => text,
  };
}

describe("LeaderboardPage integration-style tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it("loads leaderboard through the real apiFetch flow", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "http://test/api/habits/habit-1/leaderboard") {
        expect(init?.method).toBe("GET");

        return jsonResponse({
          habitId: "habit-1",
          habitName: "Morning Run",
          entries: [
            {
              memberId: "member-1",
              username: "Alice",
              totalProgress: 15,
              rank: 1,
            },
            {
              memberId: "member-2",
              username: "Bob",
              totalProgress: 9,
              rank: 2,
            },
            {
              memberId: "member-3",
              username: "Charlie",
              totalProgress: 4,
              rank: 3,
            },
          ],
        });
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    });

    render(<LeaderboardPage />);

    expect(screen.getByText(/loading leaderboard/i)).toBeInTheDocument();

    expect(await screen.findByText("Morning Run")).toBeInTheDocument();

    expect(screen.getAllByText("Alice")).toHaveLength(3);
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();

    expect(screen.getByText("Current leader")).toBeInTheDocument();
    expect(screen.getByText("Total progress:")).toBeInTheDocument();

    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("Total Progress")).toBeInTheDocument();
    expect(screen.getByText("Leader")).toBeInTheDocument();

    expect(screen.getByText("28")).toBeInTheDocument();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://test/api/habits/habit-1/leaderboard",
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("shows empty leaderboard state through the real apiFetch flow", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "http://test/api/habits/habit-1/leaderboard") {
        return jsonResponse({
          habitId: "habit-1",
          habitName: "Reading",
          entries: [],
        });
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    });

    render(<LeaderboardPage />);

    expect(await screen.findByText("Reading")).toBeInTheDocument();
    expect(screen.getByText(/no leaderboard entries yet/i)).toBeInTheDocument();

    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("Total Progress")).toBeInTheDocument();
    expect(screen.getByText("Leader")).toBeInTheDocument();

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows server error returned by the real apiFetch flow", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "http://test/api/habits/habit-1/leaderboard") {
        return textResponse("Leaderboard failed from server", 500);
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    });

    render(<LeaderboardPage />);

    expect(await screen.findByText("Leaderboard failed from server")).toBeInTheDocument();
  });

  it("shows fallback error when fetch throws", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    render(<LeaderboardPage />);

    expect(await screen.findByText("Network error")).toBeInTheDocument();
  });

  it("does not show loading after successful request finishes", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        habitId: "habit-1",
        habitName: "Gym",
        entries: [],
      })
    );

    render(<LeaderboardPage />);

    expect(await screen.findByText("Gym")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading leaderboard/i)).not.toBeInTheDocument();
    });
  });
});