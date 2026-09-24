// Regras de progresso e conclusão de metas.

import { currentMonthKey, isUpToCurrentMonth, monthKey, monthsUntil } from "./format";


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

// Só conta como guardado o que já caiu: repetições futuras de uma receita
// fixa atrelada à meta entram no mês delas.
const savedEntries = (entries: GoalEntry[] = []) =>
  entries.filter((entry) => entry.type === "income" && isUpToCurrentMonth(entry.date));

const sumValues = (entries: GoalEntry[]) =>
  entries.reduce((total, entry) => total + Math.abs(Number(entry.value)), 0);

export const sumSavedEntries = (entries: GoalEntry[] = []) => sumValues(savedEntries(entries));

export const isGoalCompleted = (goal: Goal) => sumSavedEntries(goal.entries) >= goal.value;

export type GoalMonthlyPlan = {
  // Quanto guardar por mês, calculado com o que faltava no início do mês.
  monthlyTarget: number;
  savedThisMonth: number;
  // O que ainda falta guardar neste mês, já descontando os depósitos dele.
  remainingThisMonth: number;
};

export function getGoalMonthlyPlan(goal: Goal): GoalMonthlyPlan {
  const current = currentMonthKey();
  const saved = savedEntries(goal.entries);

  const savedBefore = sumValues(saved.filter((entry) => monthKey(entry.date) < current));
  const savedThisMonth = sumValues(saved.filter((entry) => monthKey(entry.date) === current));

  const remainingAtMonthStart = Math.max(0, goal.value - savedBefore);
  const monthlyTarget = remainingAtMonthStart / monthsUntil(goal.limitDate);
  const remainingThisMonth = Math.min(
    Math.max(0, monthlyTarget - savedThisMonth),
    Math.max(0, remainingAtMonthStart - savedThisMonth),
  );

  return { monthlyTarget, savedThisMonth, remainingThisMonth };
}

export function getGoalCompletionDetails(goal: Goal): GoalCompletion {
  if (!goal || !goal.entries || goal.entries.length === 0) {
    return { isCompleted: false, completedDate: null, diffDays: 0, status: "none" };
  }

  const sortedEntries = savedEntries(goal.entries)
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
