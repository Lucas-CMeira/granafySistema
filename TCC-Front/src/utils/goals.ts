// Regras de progresso e conclusão de metas.


export interface GoalEntry {
  id?: string;
  type: string;
  value: number;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  value: number;
  limitDate: string;
  entries: GoalEntry[];
}

export type GoalCompletion = {
  isCompleted: boolean;
  completedDate: string | null;
  diffDays: number;
  status: "none" | "early" | "on_time" | "late";
};

export const sumSavedEntries = (entries: GoalEntry[] = []) =>
  entries
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + Math.abs(Number(entry.value)), 0);

export const isGoalCompleted = (goal: Goal) => sumSavedEntries(goal.entries) >= goal.value;

export function getGoalCompletionDetails(goal: Goal): GoalCompletion {
  if (!goal || !goal.entries || goal.entries.length === 0) {
    return { isCompleted: false, completedDate: null, diffDays: 0, status: "none" };
  }

  const sortedEntries = [...goal.entries]
    .filter((entry) => entry.type === "income")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let accumulated = 0;
  let completedEntry: GoalEntry | null = null;

  for (const entry of sortedEntries) {
    accumulated += Math.abs(Number(entry.value));
    if (accumulated >= goal.value && !completedEntry) {
      completedEntry = entry;
      break;
    }
  }

  if (accumulated < goal.value || !completedEntry) {
    return { isCompleted: false, completedDate: null, diffDays: 0, status: "none" };
  }

  // Datas são dias de calendário gravados em UTC; comparar em UTC evita que o
  // fuso local desloque a conclusão em um dia.
  const completed = new Date(completedEntry.date);
  const limit = new Date(goal.limitDate);

  const completedUTC = Date.UTC(
    completed.getUTCFullYear(),
    completed.getUTCMonth(),
    completed.getUTCDate()
  );
  const limitUTC = Date.UTC(limit.getUTCFullYear(), limit.getUTCMonth(), limit.getUTCDate());

  const diffDays = Math.round((limitUTC - completedUTC) / 86_400_000);

  let status: GoalCompletion["status"] = "on_time";
  if (diffDays > 0) status = "early";
  if (diffDays < 0) status = "late";

  return {
    isCompleted: true,
    completedDate: completedEntry.date,
    diffDays: Math.abs(diffDays),
    status,
  };
}
