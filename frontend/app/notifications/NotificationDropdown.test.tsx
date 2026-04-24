import { render, screen, fireEvent } from "@testing-library/react";
import NotificationDropdown from "./NotificationDropdown";

jest.mock("framer-motion", () => {
  const React = require("react");
  const cleanProps = (props: Record<string, unknown>) => {
    const { whileHover, whileTap, layout, initial, animate, exit, transition, variants, ...rest } = props;
    return rest;
  };
  const MockMotionComponent = React.forwardRef(
    ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLElement>) =>
      React.createElement("div", { ...cleanProps(props), ref }, children)
  );
  return {
    motion: new Proxy({}, { get: () => MockMotionComponent }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

function getBellTrigger() {
  return document.querySelector(".relative > div") as HTMLElement;
}

describe("NotificationDropdown", () => {
  it("renders the bell icon", () => {
    render(<NotificationDropdown />);
    expect(getBellTrigger()).toBeInTheDocument();
  });

  it("shows unread count badge", () => {
    render(<NotificationDropdown />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("dropdown is closed by default", () => {
    render(<NotificationDropdown />);
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  it("opens dropdown when bell is clicked", () => {
    render(<NotificationDropdown />);
    fireEvent.click(getBellTrigger());
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  it("displays notification content when opened", () => {
    render(<NotificationDropdown />);
    fireEvent.click(getBellTrigger());
    expect(screen.getByText("Password changed successfully")).toBeInTheDocument();
    expect(screen.getByText("Email updated successfully")).toBeInTheDocument();
  });

  it("closes dropdown when clicking trigger again", () => {
    render(<NotificationDropdown />);
    fireEvent.click(getBellTrigger());
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    fireEvent.click(getBellTrigger());
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", () => {
    render(<NotificationDropdown />);
    fireEvent.click(getBellTrigger());
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });
});