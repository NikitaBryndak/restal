// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "../test-utils";
import { LoaderOne, Loader } from "@/components/ui/loader";

describe("Loader", () => {
  it("renders three bouncing dots inside a flex wrapper", () => {
    const { container } = render(<LoaderOne />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("flex");
    expect(wrapper.children).toHaveLength(3);
  });

  it("exports Loader as an alias of LoaderOne", () => {
    expect(Loader).toBe(LoaderOne);
  });
});
