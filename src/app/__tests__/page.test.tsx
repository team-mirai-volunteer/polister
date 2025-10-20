import { render, screen } from "@testing-library/react";

import { HomePageContent } from "../_components/HomePageContent";

describe("Home Page", () => {
  it("should render the welcome heading", () => {
    render(
      <HomePageContent
        metrics={{ municipalities: 10, boards: 20, isFallback: false }}
      />
    );
    expect(
      screen.getByRole("heading", {
        name: "掲示板データ運用を直感的に可視化するトップページ",
        level: 1,
      })
    ).toBeInTheDocument();
  });
});
