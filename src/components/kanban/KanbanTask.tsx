/**
 * KanbanTask Component
 * 
 * This component represents a draggable task card in a Kanban board.
 * It handles:
 * - Task display with title, description, and metadata
 * - Drag and drop functionality
 * - Selection mode for bulk actions
 * - Task details modal display
 * - Admin-specific functionality
 */
import { Draggable } from "@hello-pangea/dnd";
import { Tables } from "@/integrations/supabase/types";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskContent } from "./TaskContent";
import { useKanbanTask } from "./hooks/useKanbanTask";
import { DraggableTaskContainer } from "./components/DraggableTaskContainer";

interface KanbanTaskProps {
  task: Tables<"tasks"> & {
    created_by_profile?: {
      email: string | null;
    } | null;
    moved_by_profile?: {
      email: string | null;
    } | null;
  };
  index: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
}

export function KanbanTask({ 
  task,
  index,
  isSelectionMode = false,
  isSelected = false,
  onSelect
}: KanbanTaskProps) {
  const {
    showModal,
    setShowModal,
    isAdmin,
    handleClick
  } = useKanbanTask({ task, isSelectionMode, onSelect });

  return (
    <>
      <Draggable 
        draggableId={task.id} 
        index={index}
        isDragDisabled={isSelectionMode || task.is_commenting}
      >
        {(provided, snapshot) => (
          <DraggableTaskContainer
            task={task}
            provided={provided}
            isDragging={snapshot.isDragging}
            onClick={handleClick}
          >
            <TaskContent
              task={task}
              isSelectionMode={isSelectionMode}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          </DraggableTaskContainer>
        )}
      </Draggable>

      <TaskDetailsModal
        task={task}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isAdmin={isAdmin}
      />
    </>
  );
}