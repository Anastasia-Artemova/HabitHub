import { render, screen, fireEvent, waitFor } from "@testing-library/react";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://test";

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

const ProfilePage = require("./page").default;

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

describe("ProfilePage integration-style tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    localStorage.clear();
    sessionStorage.clear();

    localStorage.setItem(
      "user",
      JSON.stringify({
        username: "Artem",
        email: "artem@example.com",
      })
    );

    localStorage.setItem("token", createFakeJwt({ sub: "user-123" }));
  });

  it("renders profile data from real localStorage", async () => {
    render(<ProfilePage />);

    expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    expect((await screen.findAllByText("Artem")).length).toBeGreaterThanOrEqual(1);
    expect((await screen.findAllByText("artem@example.com")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/active member/i)).toBeInTheDocument();
  });

  it("updates profile through the real apiFetch flow and updates localStorage", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        token: "new-token",
        id: "user-123",
        username: "ArtemUpdated",
      })
    );

    render(<ProfilePage />);

    fireEvent.click(screen.getByText(/edit profile details/i));

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "ArtemUpdated" } });
    fireEvent.change(inputs[1], { target: { value: "updated@example.com" } });

    fireEvent.click(screen.getByText(/save changes/i));

    expect(await screen.findByText(/profile updated successfully/i)).toBeInTheDocument();

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(String(url)).toBe("http://test/api/profile/info");
    expect((options as RequestInit).method).toBe("PUT");
    expect(((options as RequestInit).headers as Headers).get("Authorization")).toContain(
      "Bearer"
    );
    expect((options as RequestInit).body).toBe(
      JSON.stringify({
        username: "ArtemUpdated",
        email: "updated@example.com",
      })
    );

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    expect(storedUser.username).toBe("ArtemUpdated");
    expect(storedUser.email).toBe("updated@example.com");
  });

  it("shows validation error for invalid email without making a network call", async () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByText(/edit profile details/i));

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[1], { target: { value: "invalid-email" } });

    fireEvent.click(screen.getByText(/save changes/i));

    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("changes password through the real apiFetch flow", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        token: "same-token",
        id: "user-123",
      })
    );

    render(<ProfilePage />);

    fireEvent.click(screen.getByText(/change password/i));

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "OldPass123!" } });
    fireEvent.change(inputs[1], { target: { value: "NewPass123!" } });
    fireEvent.change(inputs[2], { target: { value: "NewPass123!" } });

    fireEvent.click(screen.getByText(/update password/i));

    expect(await screen.findByText(/password changed successfully/i)).toBeInTheDocument();

    const [url, options] = mockFetch.mock.calls[0];
    expect(String(url)).toBe("http://test/api/profile/password");
    expect((options as RequestInit).method).toBe("PUT");
    expect((options as RequestInit).body).toBe(
      JSON.stringify({
        currentPassword: "OldPass123!",
        newPassword: "NewPass123!",
      })
    );
  });

  it("shows the backend message when password update fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: {
        get: (key: string) =>
          key.toLowerCase() === "content-type" ? "application/json" : null,
      },
      json: async () => ({ message: "Current password is incorrect" }),
      text: async () => "",
    });

    render(<ProfilePage />);

    fireEvent.click(screen.getByText(/change password/i));

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "WrongPass123!" } });
    fireEvent.change(inputs[1], { target: { value: "NewPass123!" } });
    fireEvent.change(inputs[2], { target: { value: "NewPass123!" } });

    fireEvent.click(screen.getByText(/update password/i));

    expect(await screen.findByText(/current password is incorrect/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});