import React from 'react';

import useTasks from './useTasks';

import TaskForm from './TaskForm';
import TaskList from './TaskList';
import './App.css';

function App() {
  const { tasks, loading, error, addTask, updateTask, deleteTask, moveTask } = useTasks();

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <TaskForm onAdd={addTask} />

        <section className="items-section">
          <h2>Tasks</h2>
          {loading && <p>Loading tasks...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && (
            <TaskList
              items={tasks}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onMove={moveTask}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;