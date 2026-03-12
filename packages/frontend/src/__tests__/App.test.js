import React, { act } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const MOCK_TASKS = [
  { id: 1, name: 'Task One', description: null, due_date: null, position: 1, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 2, name: 'Task Two', description: 'A description', due_date: '2026-06-15', position: 2, created_at: '2026-01-02T00:00:00.000Z' },
];

const server = setupServer(
  rest.get('/api/items', (req, res, ctx) => res(ctx.status(200), ctx.json(MOCK_TASKS))),

  rest.post('/api/items', (req, res, ctx) => {
    const { name, description, due_date } = req.body;
    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Item name is required' }));
    }
    return res(ctx.status(201), ctx.json({
      id: 99,
      name: name.trim(),
      description: description || null,
      due_date: due_date || null,
      position: 3,
      created_at: new Date().toISOString(),
    }));
  }),

  rest.put('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    const { name, description, due_date } = req.body;
    const existing = MOCK_TASKS.find((t) => t.id === parseInt(id));
    if (!existing) return res(ctx.status(404), ctx.json({ error: 'Item not found' }));
    return res(ctx.status(200), ctx.json({
      ...existing,
      name: name ?? existing.name,
      description: description !== undefined ? description : existing.description,
      due_date: due_date !== undefined ? due_date : existing.due_date,
    }));
  }),

  rest.delete('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.status(200), ctx.json({ message: 'Item deleted successfully', id: parseInt(id) }));
  }),

  rest.patch('/api/items/:id/position', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(MOCK_TASKS));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the app header', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByText('To Do App')).toBeInTheDocument();
    expect(screen.getByText('Keep track of your tasks')).toBeInTheDocument();
  });

  test('shows loading state initially', async () => {
    render(<App />);
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());
  });

  test('loads and displays tasks', async () => {
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.getByText('Task Two')).toBeInTheDocument();
    });
  });

  test('displays description when present', async () => {
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getByText('A description')).toBeInTheDocument();
    });
  });

  test('displays due date badge when present', async () => {
    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getByText(/2026-06-15/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks', async () => {
    server.use(rest.get('/api/items', (req, res, ctx) => res(ctx.status(200), ctx.json([]))));

    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getByText('No tasks found. Add some!')).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

    await user.type(screen.getByLabelText(/task name/i), 'Brand New Task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Brand New Task')).toBeInTheDocument();
    });
  });

  test('adds a new task with description', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

    await user.type(screen.getByLabelText(/task name/i), 'Task With Desc');
    await user.type(screen.getByLabelText(/description/i), 'My details');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText('Task With Desc')).toBeInTheDocument();
    });
  });

  test('clears form after adding a task', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

    const nameInput = screen.getByLabelText(/task name/i);
    await user.type(nameInput, 'Temporary Task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => expect(nameInput.value).toBe(''));
  });

  test('enters edit mode when Edit button is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /edit "task one"/i }));

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel editing/i })).toBeInTheDocument();
  });

  test('saves edited task name', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /edit "task one"/i }));

    const nameInput = screen.getByDisplayValue('Task One');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Task One');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText('Updated Task One')).toBeInTheDocument();
    });
  });

  test('cancels edit and restores original name', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /edit "task one"/i }));
    const nameInput = screen.getByDisplayValue('Task One');
    await user.clear(nameInput);
    await user.type(nameInput, 'Should Not Save');
    await user.click(screen.getByRole('button', { name: /cancel editing/i }));

    expect(screen.getByText('Task One')).toBeInTheDocument();
    expect(screen.queryByText('Should Not Save')).not.toBeInTheDocument();
  });

  test('deletes a task', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /delete "task one"/i }));

    await waitFor(() => {
      expect(screen.queryByText('Task One')).not.toBeInTheDocument();
    });
  });

  test('handles API error on initial load', async () => {
    server.use(rest.get('/api/items', (req, res, ctx) => res(ctx.status(500))));

    await act(async () => { render(<App />); });
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch tasks/i)).toBeInTheDocument();
    });
  });

  test('moves a task using the reorder button', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /move "task one" down/i }));

    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.getByText('Task Two')).toBeInTheDocument();
    });
  });

  test('shows error when adding a task fails', async () => {
    server.use(rest.post('/api/items', (req, res, ctx) => res(ctx.status(500))));

    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

    await user.type(screen.getByLabelText(/task name/i), 'Fail Task');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    await waitFor(() => {
      expect(screen.getByText(/error adding task/i)).toBeInTheDocument();
    });
  });

  test('shows error when updating a task fails', async () => {
    server.use(rest.put('/api/items/:id', (req, res, ctx) => res(ctx.status(500))));

    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /edit "task one"/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/error updating task/i)).toBeInTheDocument();
    });
  });

  test('shows error when deleting a task fails', async () => {
    server.use(rest.delete('/api/items/:id', (req, res, ctx) => res(ctx.status(500))));

    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /delete "task one"/i }));

    await waitFor(() => {
      expect(screen.getByText(/error deleting task/i)).toBeInTheDocument();
    });
  });

  test('shows error when reordering a task fails', async () => {
    server.use(rest.patch('/api/items/:id/position', (req, res, ctx) => res(ctx.status(500))));

    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /move "task one" down/i }));

    await waitFor(() => {
      expect(screen.getByText(/error reordering task/i)).toBeInTheDocument();
    });
  });

  test('pressing Escape cancels edit and restores the original name', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.getByText('Task One')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /edit "task one"/i }));
    const nameInput = screen.getByDisplayValue('Task One');
    await user.clear(nameInput);
    await user.type(nameInput, 'Should Be Discarded');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
  });
});
