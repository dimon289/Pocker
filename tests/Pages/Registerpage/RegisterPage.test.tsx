/// <reference types="vitest" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Register from "../../../src/Pages/RegisterPage/Register";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window.localStorage.__proto__, "setItem");
});

afterEach(() => {
  vi.restoreAllMocks();
});

const setup = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

test("рендерить форму реєстрації", () => {
  setup();
  expect(screen.getByText(/Реєстрація/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Submit/i })).toBeInTheDocument();
});

test("показує помилки при пустих полях", async () => {
  setup();
  const submit = screen.getByRole("button", { name: /Submit/i });
  fireEvent.click(submit);

  await waitFor(() => {
    expect(screen.getByText(/Невведено ім'я/)).toBeInTheDocument();
    expect(screen.getByText(/Невведено email/)).toBeInTheDocument();
    expect(screen.getByText(/Невведено пароль/)).toBeInTheDocument();
    expect(screen.getByText(/Невведено пароль для перевірки/)).toBeInTheDocument();
    expect(screen.getByText(/Введіть коректний email!/)).toBeInTheDocument();
  });

  expect(localStorage.setItem).not.toHaveBeenCalled();
});

