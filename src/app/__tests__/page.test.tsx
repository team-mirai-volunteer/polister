import { render, screen } from "@testing-library/react";

import Page from "../page";

describe("Home Page", () => {
  it("should render the welcome heading", () => {
    render(<Page />);
    expect(
      screen.getByText("Polisterプロジェクトへようこそ")
    ).toBeInTheDocument();
  });
});
