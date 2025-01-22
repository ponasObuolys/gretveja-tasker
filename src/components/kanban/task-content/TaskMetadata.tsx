import { format } from "date-fns";

interface TaskMetadataProps {
  creatorEmail?: string | null;
  moverEmail?: string | null;
  deadline?: string | null;
}

export function TaskMetadata({ creatorEmail, moverEmail, deadline }: TaskMetadataProps) {
  return (
    <div className="text-xs text-gray-400 truncate">
      {creatorEmail && (
        <span>Sukūrė: {creatorEmail}</span>
      )}
      {moverEmail && (
        <>
          <span className="mx-1">•</span>
          <span>Perkėlė: {moverEmail}</span>
        </>
      )}
      {deadline && (
        <>
          <span className="mx-1">•</span>
          <span>Terminas: {format(new Date(deadline), "yyyy-MM-dd")}</span>
        </>
      )}
    </div>
  );
}