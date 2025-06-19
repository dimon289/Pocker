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

test("зберігає дані в localStorage після умовного успішного сабміту", async () => {
  const { container } = setup();

  fireEvent.change(container.querySelector('input[name="nickName"]')!, {
    target: { value: "Тест" },
  });
  fireEvent.change(container.querySelector('input[name="email"]')!, {
    target: { value: "test@example.com" },
  });
  fireEvent.change(container.querySelector('input[name="password"]')!, {
    target: { value: "123456" },
  });
  fireEvent.change(container.querySelector('input[name="checkPassword"]')!, {
    target: { value: "123456" },
  });

  // Тут виконуємо клік по кнопці Submit — передбачається, що в твоєму компоненті при валідації успішно буде виклик localStorage.setItem
  fireEvent.click(screen.getByRole("button", { name: /Submit/i }));

  await waitFor(() => {
    expect(localStorage.setItem).toHaveBeenCalledWith("token", expect.any(String));
  });
});
