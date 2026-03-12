import React, { useState } from 'react';

function TaskForm({ onAdd }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), description: description.trim() || null, due_date: dueDate || null });
    setName('');
    setDescription('');
    setDueDate('');
  };

  return (
    <section className="add-item-section">
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit} className="task-form">
        <label htmlFor="task-name" className="field-label">
          Task name
          <input
            id="task-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter task name"
          />
        </label>
        <label htmlFor="task-description" className="field-label field-label--full">
          Description
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="description-input"
            rows={2}
          />
        </label>
        <label htmlFor="task-due-date" className="due-date-label">
          Due date
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="due-date-input"
          />
        </label>
        <button type="submit">Add Task</button>
      </form>
    </section>
  );
}

export default TaskForm;
