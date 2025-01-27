import { useDropzone } from 'react-dropzone';

function TaskAttachments({ taskId }: { taskId: number }) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleFileUpload,
    multiple: true
  });

  return (
    <div className="task-attachments">
      <h4>Prisegti failai</h4>
      <div {...getRootProps()} className="upload-zone">
        <input {...getInputProps()} />
        <p>Tempkite failus čia arba paspauskite norėdami įkelti</p>
      </div>
      {/* ... existing attachment list ... */}
    </div>
  );
}

export default TaskAttachments; 