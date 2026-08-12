import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      defaults: { headers: { common: {} } },
    })),
    post: jest.fn(),
  },
}));

beforeEach(() => {
  localStorage.clear();
});

test('renders accessible login form fields', () => {
  render(<App />);

  expect(screen.getByLabelText(/שם משתמש/)).toBeInTheDocument();
  expect(screen.getByLabelText(/סיסמה/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /התחבר/ })).toBeInTheDocument();
});
