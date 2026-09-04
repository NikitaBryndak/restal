// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import {
  Skeleton,
  PageSkeleton,
  CardSkeleton,
  TripCardSkeleton,
  ArticleCardSkeleton,
  ProfileSkeleton,
  DashboardFormSkeleton,
  SettingsSkeleton,
  TableSkeleton,
  AnalyticsSkeleton,
  AuthFormSkeleton,
  HomeSkeleton,
  CashbackSkeleton,
} from "@/components/ui/skeleton";

const countBars = (container: HTMLElement) =>
  container.querySelectorAll('[data-slot="skeleton"]').length;

describe("Skeleton", () => {
  it("renders a pulsing div with data-slot and merges className", () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("data-slot", "skeleton");
    expect(el).toHaveClass("animate-pulse", "rounded-xl");
    expect(el).toHaveClass("h-4", "w-10");
  });

  it("passes through extra props", () => {
    const { container } = render(<Skeleton aria-hidden="true" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("PageSkeleton", () => {
  it("renders the default centered placeholder (5 bars) when no children given", () => {
    const { container } = render(<PageSkeleton />);
    expect(countBars(container)).toBe(5);
  });

  it("renders custom children instead of the default content", () => {
    const { container } = render(
      <PageSkeleton>
        <div>custom</div>
      </PageSkeleton>
    );
    expect(screen.getByText("custom")).toBeInTheDocument();
    expect(countBars(container)).toBe(0);
  });

  it("merges className onto the wrapper", () => {
    const { container } = render(<PageSkeleton className="p-2" />);
    expect(container.firstElementChild).toHaveClass("flex", "min-h-[60vh]", "p-2");
  });
});

describe("card and list skeletons", () => {
  it("CardSkeleton renders 3 bars in a glass card", () => {
    const { container } = render(<CardSkeleton />);
    expect(countBars(container)).toBe(3);
    expect(container.firstElementChild).toHaveClass("rounded-2xl");
  });

  it("TripCardSkeleton matches the TripCard layout (image + details, 10 bars)", () => {
    const { container } = render(<TripCardSkeleton />);
    expect(countBars(container)).toBe(10);
  });

  it("ArticleCardSkeleton matches the ArticleCard layout (5 bars)", () => {
    const { container } = render(<ArticleCardSkeleton />);
    expect(countBars(container)).toBe(5);
  });
});

describe("page skeletons", () => {
  it("ProfileSkeleton renders hero + stats grid + two info cards (19 bars)", () => {
    const { container } = render(<ProfileSkeleton />);
    expect(countBars(container)).toBe(19);
  });

  it("DashboardFormSkeleton renders header + 3 form sections (12 bars)", () => {
    const { container } = render(<DashboardFormSkeleton />);
    expect(countBars(container)).toBe(12);
  });

  it("SettingsSkeleton renders title row + 3 settings cards (14 bars)", () => {
    const { container } = render(<SettingsSkeleton />);
    expect(countBars(container)).toBe(14);
  });

  it("AnalyticsSkeleton renders header + 8 stat cards + 2 charts (23 bars)", () => {
    const { container } = render(<AnalyticsSkeleton />);
    expect(countBars(container)).toBe(23);
  });

  it("AuthFormSkeleton renders the split login layout (9 bars)", () => {
    const { container } = render(<AuthFormSkeleton />);
    expect(countBars(container)).toBe(9);
  });

  it("HomeSkeleton renders inside a <main> with hero bars (6 bars)", () => {
    const { container } = render(<HomeSkeleton />);
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(countBars(container)).toBe(6);
  });

  it("CashbackSkeleton renders the full cashback page layout (40 bars)", () => {
    const { container } = render(<CashbackSkeleton />);
    expect(container.querySelector("main")).toBeInTheDocument();
    expect(countBars(container)).toBe(40);
  });
});

describe("TableSkeleton", () => {
  it("renders header, filter bar and the default 5 rows (27 bars)", () => {
    const { container } = render(<TableSkeleton />);
    // header (3) + filter bar (4) + 5 rows x 4 bars
    expect(countBars(container)).toBe(27);
  });

  it("honors the rows prop", () => {
    const { container } = render(<TableSkeleton rows={2} />);
    // header (3) + filter bar (4) + 2 rows x 4 bars
    expect(countBars(container)).toBe(15);
  });
});
