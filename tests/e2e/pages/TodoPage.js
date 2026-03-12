/**
 * Page Object Model for the TODO app.
 *
 * Encapsulates all selectors and interactions so that spec files stay
 * focused on the *what*, not the *how*.
 */
class TodoPage {
  constructor(page) {
    this.page = page;

    // The add-task form section (scoped so its labels don't clash with edit-mode labels)
    this.addForm = page.locator('.add-item-section');

    // The task list <ul> (only present when there is at least one task)
    this.taskList = page.getByRole('list', { name: 'Task list' });
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  // ---------------------------------------------------------------------------
  // Add-task form
  // ---------------------------------------------------------------------------

  async addTask({ name, description, dueDate }) {
    await this.addForm.getByLabel('Task name').fill(name);
    if (description) await this.addForm.getByLabel('Description').fill(description);
    if (dueDate) await this.addForm.getByLabel('Due date').fill(dueDate);
    await this.addForm.getByRole('button', { name: 'Add Task' }).click();
    // Wait for the new task to appear before returning
    await this.page.locator('.task-name', { hasText: name }).waitFor({ state: 'visible' });
  }

  async getAddFormValues() {
    return {
      name: await this.addForm.getByLabel('Task name').inputValue(),
      description: await this.addForm.getByLabel('Description').inputValue(),
      dueDate: await this.addForm.getByLabel('Due date').inputValue(),
    };
  }

  // ---------------------------------------------------------------------------
  // Task item interactions
  // ---------------------------------------------------------------------------

  /**
   * Returns the <li> for a task that is currently in *view* mode, identified
   * by the visible .task-name span.
   */
  _viewItem(name) {
    return this.taskList.getByRole('listitem').filter({
      has: this.page.locator('.task-name', { hasText: name }),
    });
  }

  /**
   * Returns the <li> that is currently in *edit* mode (identified by the
   * presence of the "Save changes" button).
   */
  _editingItem() {
    return this.taskList.getByRole('listitem').filter({
      has: this.page.getByRole('button', { name: 'Save changes' }),
    });
  }

  async startEdit(name) {
    await this._viewItem(name)
      .getByRole('button', { name: `Edit "${name}"` })
      .click();
  }

  async fillEditField(label, value) {
    const field = this._editingItem().getByLabel(label);
    await field.clear();
    await field.fill(value);
  }

  async saveEdit(updatedName) {
    await this._editingItem().getByRole('button', { name: 'Save changes' }).click();
    if (updatedName) {
      await this.page.locator('.task-name', { hasText: updatedName }).waitFor({ state: 'visible' });
    }
  }

  async cancelEdit() {
    await this._editingItem().getByRole('button', { name: 'Cancel editing' }).click();
  }

  async deleteTask(name) {
    await this._viewItem(name)
      .getByRole('button', { name: `Delete "${name}"` })
      .click();
    await this.page.locator('.task-name', { hasText: name }).waitFor({ state: 'hidden' });
  }

  async moveTask(name, direction) {
    await this._viewItem(name)
      .getByRole('button', { name: `Move "${name}" ${direction}` })
      .click();
  }

  // ---------------------------------------------------------------------------
  // Assertions helpers
  // ---------------------------------------------------------------------------

  /** Returns the locator for all .task-name spans — use with toHaveText([...]) */
  taskNameLocators() {
    return this.taskList.locator('.task-name');
  }

  emptyMessage() {
    return this.page.getByText('No tasks found. Add some!');
  }
}

module.exports = { TodoPage };
