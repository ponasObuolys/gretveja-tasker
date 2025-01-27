import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

interface TaskLink {
  id: number;
  task_id: number;
  url: string;
  title: string;
}

export function TaskLinks({ taskId }: { taskId: number }) {
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  return (
    <div className="task-links">
      <h4>Nuorodos</h4>
      <div className="add-link-form">
        <input
          type="text"
          placeholder="Pavadinimas"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          type="url"
          placeholder="URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
        />
        <button onClick={handleAddLink}>Pridėti</button>
      </div>
      <div className="links-list">
        {/* Links list rendering */}
      </div>
    </div>
  );
} 