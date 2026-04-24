import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';

test('renders hero headline', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AppRoutes />
    </MemoryRouter>
  );
  expect(
    screen.getByText(/Save food\. Save money\. Save the planet\./i)
  ).toBeInTheDocument();
});
