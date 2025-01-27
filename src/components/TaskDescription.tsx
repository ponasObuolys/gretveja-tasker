import React from 'react';
import type { Task } from './types';

function TaskDescription({ task }: { task: Task }) {
  return (
    <div className="task-description">
      <h4>Aprašymas</h4>
      <p>{task.description || 'Nėra aprašymo'}</p>
    </div>
  );
}

export default TaskDescription;