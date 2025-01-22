import { Draggable } from "@hello-pangea/dnd";
import { Tables } from "@/integrations/supabase/types";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskContent } from "./TaskContent";
import { useKanbanTask } from "./hooks/useKanbanTask";
import { DraggableTaskContainer } from "./components/DraggableTaskContainer";
import { useSwipeable } from "react-swipeable";

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

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isAdmin) return;
      // Move task to next status
      console.log("Swiped left on task:", task.id);
    },
    onSwipedRight: () => {
      if (!isAdmin) return;
      // Move task to previous status
      console.log("Swiped right on task:", task.id);
    },
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  return (
    <>
      <Draggable 
        draggableId={task.id} 
        index={index}
        isDragDisabled={isSelectionMode || task.is_commenting}
      >
        {(provided, snapshot) => (
          <div {...handlers}>
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
          </div>
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