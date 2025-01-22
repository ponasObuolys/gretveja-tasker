import { ActivityType, TaskWithProfile } from "./types";

export function ActivityMessage({ activity }: { activity: ActivityType }) {
  return (
    <p className="text-gray-300">{getActivityMessage(activity)}</p>
  );
}

function getActivityMessage(activity: ActivityType) {
  switch (activity.type) {
    case 'task':
      return getStatusMessage(activity.data);
    case 'comment':
      return `Pridėtas komentaras prie užduoties "${activity.data.tasks.title}"`;
    case 'attachment':
      return `Įkeltas failas prie užduoties "${activity.data.tasks.title}"`;
    case 'link':
      return `Pridėta nuoroda prie užduoties "${activity.data.tasks.title}"`;
    default:
      return 'Nežinomas veiksmas';
  }
}

function getStatusMessage(task: TaskWithProfile) {
  switch (task.status) {
    case "IVYKDYTOS":
      return `Užduotis "${task.title}" pažymėta kaip įvykdyta`;
    case "ATMESTOS":
      return `Užduotis "${task.title}" atmesta`;
    case "VYKDOMOS":
      return `Užduotis "${task.title}" pradėta vykdyti`;
    case "NUKELTOS":
      return `Užduotis "${task.title}" nukelta`;
    case "VELUOJANCIOS":
      return `Užduotis "${task.title}" vėluoja`;
    case "NAUJOS":
      return `Sukurta nauja užduotis "${task.title}"`;
    default:
      return `Užduoties "${task.title}" statusas atnaujintas`;
  }
}