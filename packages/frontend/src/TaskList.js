import React from 'react';
import TaskItem from './TaskItem';

function TaskList({ items, onUpdate, onDelete, onMove }) {
  if (items.length === 0) {
    return <p>No tasks found. Add some!</p>;
  }

  return (
    <ul className="task-list" aria-label="Task list">
      {items.map((item, index) => (
        <TaskItem
          key={item.id}
          item={item}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </ul>
  );
}

export default TaskList;
