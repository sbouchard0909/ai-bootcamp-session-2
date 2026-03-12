import React, { useState } from 'react';

function TaskItem({ item, isFirst, isLast, onUpdate, onDelete, onMove }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editDescription, setEditDescription] = useState(item.description || '');
  const [editDueDate, setEditDueDate] = useState(item.due_date || '');

  const handleSave = () => {
    if (!editName.trim()) return;
    onUpdate(item.id, { name: editName.trim(), description: editDescription.trim() || null, due_date: editDueDate || null });
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setEditName(item.name);
      setEditDescription(item.description || '');
      setEditDueDate(item.due_date || '');
      setIsEditing(false);
    }
  };

  const handleEditStart = () => {
    setEditName(item.name);
    setEditDescription(item.description || '');
    setEditDueDate(item.due_date || '');
    setIsEditing(true);
  };

  return (
    <li className="task-item">
      <div className="task-reorder">
        <button
          type="button"
          onClick={() => onMove(item.id, 'up')}
          disabled={isFirst}
          aria-label={`Move "${item.name}" up`}
          className="reorder-btn"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMove(item.id, 'down')}
          disabled={isLast}
          aria-label={`Move "${item.name}" down`}
          className="reorder-btn"
        >
          ▼
        </button>
      </div>

      <div className="task-content">
        {isEditing ? (
          <div className="task-edit-fields">
            <label htmlFor={`edit-name-${item.id}`} className="field-label">
              Task name
              <input
                id={`edit-name-${item.id}`}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </label>
            <label htmlFor={`edit-desc-${item.id}`} className="field-label">
              Description
              <textarea
                id={`edit-desc-${item.id}`}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                className="description-input"
                rows={2}
              />
            </label>
            <label htmlFor={`edit-due-${item.id}`} className="due-date-label">
              Due date
              <input
                id={`edit-due-${item.id}`}
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="due-date-input"
              />
            </label>
          </div>
        ) : (
          <div className="task-display">
            <span className="task-name">{item.name}</span>
            {item.description && (
              <span className="task-description">{item.description}</span>
            )}
            {item.due_date && (
              <span className="task-due-date" aria-label={`Due date: ${item.due_date}`}>
                Due: {item.due_date}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="task-actions">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              aria-label="Save changes"
              className="save-btn"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              aria-label="Cancel editing"
              className="cancel-btn"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleEditStart}
            aria-label={`Edit "${item.name}"`}
            className="edit-btn"
          >
            Edit
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          aria-label={`Delete "${item.name}"`}
          className="delete-btn"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default TaskItem;
