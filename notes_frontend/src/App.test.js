import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders header with app title", () => {
  render(<App />);
  expect(screen.getByText(/Minimal Notes/i)).toBeInTheDocument();
});
