const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

const BACKEND_URL = 'http://localhost:3030';

// ---------------------------------------------------------------------------
// Test isolation — wipe all tasks before each test via the API so every
// journey begins from a clean, empty state.
// ---------------------------------------------------------------------------

test.beforeEach(async ({ request }) => {
  const res = await request.get(`${BACKEND_URL}/api/items`);
  const items = await res.json();
  for (const item of items) {
    await request.delete(`${BACKEND_URL}/api/items/${item.id}`);
  }
});

// ---------------------------------------------------------------------------
// Critical user journeys
// ---------------------------------------------------------------------------

test.describe('TODO App — critical user journeys', () => {
  // Journey 1: Add a task (name only)
  test('adds a task with a name and shows it in the list', async ({ page }) => {
    const todo = new TodoPage(page);
    await todo.goto();

    await todo.addTask({ name: 'Buy groceries' });

    await expect(page.locator('.task-name', { hasText: 'Buy groceries' })).toBeVisible();
  });

  // Journey 2: Add a task with all optional fields
  test('adds a task with description and due date, both visible in the list', async ({ page }) => {
    const todo = new TodoPage(page);
    await todo.goto();

    await todo.addTask({
      name: 'Write report',
      description: 'Cover Q1 highlights',
      dueDate: '2026-04-30',
    });

    const item = todo._viewItem('Write report');
    await expect(item.locator('.task-name')).toHaveText('Write report');
    await expect(item.locator('.task-description')).toHaveText('Cover Q1 highlights');
    await expect(item.locator('.task-due-date')).toContainText('2026-04-30');
  });

  // Journey 3: Form resets after a successful submission
  test('clears all form fields after adding a task', async ({ page }) => {
    const todo = new TodoPage(page);
    await todo.goto();

    await todo.addTask({ name: 'Temporary Task', description: 'Some notes', dueDate: '2026-05-01' });

    const values = await todo.getAddFormValues();
    expect(values.name).toBe('');
    expect(values.description).toBe('');
    expect(values.dueDate).toBe('');
  });

  // Journey 4: Edit a task's name and description
  test('edits a task and the updated values appear in the list', async ({ page }) => {
    const todo = new TodoPage(page);
    await todo.goto();

    await todo.addTask({ name: 'Original Name', description: 'Old description' });

    await todo.startEdit('Original Name');
    await todo.fillEditField('Task name', 'Updated Name');
    await todo.fillEditField('Description', 'New description');
    await todo.saveEdit('Updated Name');

    await expect(page.locator('.task-name', { hasText: 'Updated Name' })).toBeVisible();
    await expect(page.locator('.task-description', { hasText: 'New description' })).toBeVisible();
    await expect(page.locator('.task-name', { hasText: 'Original Name' })).not.toBeVisible();
  });

  // Journey 5: Cancel edit restores the original name
  test('cancelling an edit restores the original task name', async ({ page }) => {
    const todo = new TodoPage(page);
    await todo.goto();

    await todo.addTask({ name: 'Keep This Name' });

    await todo.startEdit('Keep This Name');
    await todo.fillEditField('Task name', 'Should Not Save');
    await todo.cancelEdit();

    await expect(page.locator('.task-name', { hasText: 'Keep This Name' })).toBeVisible();
    await expect(page.locator('.task-name', { hasText: 'Should Not Save' })).not.toBeVisible();
  });

  // Journey 6: Reorder tasks with the move up / move down buttons
  test('reorders tasks correctly using the move buttons', async ({ page }) => {
    const todo = new TodoPage(page);
    await todo.goto();

    await todo.addTask({ name: 'Task Alpha' });
    await todo.addTask({ name: 'Task Beta' });
    await todo.addTask({ name: 'Task Gamma' });

    // Initial order: Alpha → Beta → Gamma
    await expect(todo.taskNameLocators()).toHaveText(['Task Alpha', 'Task Beta', 'Task Gamma']);

    // Move Gamma up once → Alpha → Gamma → Beta
    await todo.moveTask('Task Gamma', 'up');
    await expect(todo.taskNameLocators()).toHaveText(['Task Alpha', 'Task Gamma', 'Task Beta']);

    // Move Alpha down once → Gamma → Alpha → Beta
    await todo.moveTask('Task Alpha', 'down');
    await expect(todo.taskNameLocators()).toHaveText(['Task Gamma', 'Task Alpha', 'Task Beta']);
  });

  // Journey 7: Delete a task
  test('deletes a task and it is removed from the list', async ({ page }) => {
    const todo = new TodoPage(page);
    await todo.goto();

    await todo.addTask({ name: 'Task to Delete' });
    await expect(page.locator('.task-name', { hasText: 'Task to Delete' })).toBeVisible();

    await todo.deleteTask('Task to Delete');

    await expect(page.locator('.task-name', { hasText: 'Task to Delete' })).not.toBeVisible();
  });

  // Journey 8: Empty state
  test('shows the empty state message when there are no tasks', async ({ page }) => {
    const todo = new TodoPage(page);
    await todo.goto();

    await expect(todo.emptyMessage()).toBeVisible();
    await expect(page.locator('[aria-label="Task list"]')).not.toBeVisible();
  });
});
