import { useState, useEffect } from 'react';

function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      setTasks(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async ({ name, description, due_date }) => {
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, due_date }),
      });
      if (!response.ok) throw new Error('Failed to add task');
      const newTask = await response.json();
      setTasks((prev) => [...prev, newTask]);
      setError(null);
    } catch (err) {
      setError('Error adding task: ' + err.message);
      console.error('Error adding task:', err);
    }
  };

  const updateTask = async (id, { name, description, due_date }) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, due_date }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      const updatedTask = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      setError(null);
    } catch (err) {
      setError('Error updating task: ' + err.message);
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete task');
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
      console.error('Error deleting task:', err);
    }
  };

  const moveTask = async (id, direction) => {
    try {
      const response = await fetch(`/api/items/${id}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      if (!response.ok) throw new Error('Failed to reorder task');
      const reorderedTasks = await response.json();
      setTasks(reorderedTasks);
      setError(null);
    } catch (err) {
      setError('Error reordering task: ' + err.message);
      console.error('Error reordering task:', err);
    }
  };

  return { tasks, loading, error, addTask, updateTask, deleteTask, moveTask };
}

export default useTasks;
