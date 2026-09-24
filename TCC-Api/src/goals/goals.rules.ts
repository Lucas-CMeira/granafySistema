export function startOfNextMonth() {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
}

export function hasFallen(date: Date | string) {
    return new Date(date).getTime() < startOfNextMonth().getTime();
}

export function savedInGoal(entries: { type: string; value: number; date: Date | string }[] = []) {
    return entries
        .filter((entry) => entry.type === "income" && hasFallen(entry.date))
        .reduce((total, entry) => total + Math.abs(Number(entry.value)), 0);
}

export function isGoalCompleted(goal: { value: number; entries?: { type: string; value: number; date: Date | string }[] }) {
    return savedInGoal(goal.entries) >= goal.value;
}

export const roundMoney = (value: number) => Math.round(value * 100) / 100;
