// Serviço de lançamentos: criação, listagem com sincronização de fixos mensais, atualização e exclusão.

import { EntriesRepository } from "./entries.repository"
import { CategoriesRepository } from "../categories/categories.repository"
import { GoalsRepository } from "../goals/goals.repository"
import { EntryType } from "@prisma/client"

export class EntriesService {

    constructor(
        private entriesRepository: EntriesRepository,
        private categoriesRepository: CategoriesRepository,
        private goalsRepository: GoalsRepository
    ) { }

    private isGoalCompleted(goal: { value: number; entries?: { type: string; value: number }[] }) {
        const saved = (goal.entries || [])
            .filter((entry) => entry.type === "income")
            .reduce((total, entry) => total + Math.abs(Number(entry.value)), 0);
        return saved >= goal.value;
    }

    async createEntry(
        title: string,
        description: string | undefined,
        value: number,
        type: string,
        date: Date,
        userId: string,
        categoryId: string,
        goalId: string | undefined,
        isFixed: boolean = false,
        repeatCount: number | undefined = undefined,
        parentId: string | undefined = undefined
    ) {
        if (!title || value === undefined || !type || !date || !categoryId) {
            throw new Error("Título, Valor, Tipo, Data e Categoria são obrigatórios")
        }

        if (type !== "income" && type !== "expenses") {
            throw new Error("Tipo inválido. Deve ser 'income' ou 'expenses'")
        }

        if (isNaN(Number(value)) || Number(value) <= 0) {
            throw new Error("O valor do lançamento deve ser maior que zero")
        }

        if (isNaN(date.getTime())) {
            throw new Error("Data inválida")
        }

        const category = await this.categoriesRepository.findById(categoryId, userId);
        if (!category) {
            throw new Error("Categoria não encontrada ou sem permissão");
        }

        if (goalId) {
            if (type !== "income") {
                throw new Error("Somente lançamentos de receita podem ser atrelados a uma meta");
            }
            const goal = await this.goalsRepository.findById(goalId, userId);
            if (!goal) {
                throw new Error("Meta não encontrada ou sem permissão");
            }
            if (this.isGoalCompleted(goal)) {
                throw new Error("Esta meta já foi concluída. Não é possível atrelar novos lançamentos a ela.");
            }
        }

        if (isFixed && (!repeatCount || repeatCount < 1 || repeatCount > 12)) {
            throw new Error("Informe quantas vezes o lançamento deve se repetir (1 a 12 meses)");
        }

        const payload: any = {
            title,
            value,
            type: type as EntryType,
            date,
            userId,
            categoryId
        };
        if (description) payload.description = description;
        if (goalId) payload.goalId = goalId;
        if (isFixed) payload.isFixed = true;
        if (repeatCount) payload.repeatCount = repeatCount;
        if (parentId) payload.parentId = parentId;

        return await this.entriesRepository.create(payload);
    }

    async getEntries(userId: string) {
        const fixedEntries = await this.entriesRepository.findFixedEntries(userId);

        for (const fixed of fixedEntries) {
            const fixedEntryDate = new Date(fixed.date);
            const startYear = fixedEntryDate.getUTCFullYear();
            const startMonth = fixedEntryDate.getUTCMonth();

            const dayToUse = fixed.fixedDay || fixedEntryDate.getUTCDate();
            const totalMonths = fixed.repeatCount ?? 12;

            for (let i = 0; i < totalMonths; i++) {
                const targetDate = new Date(Date.UTC(startYear, startMonth + i, 1));
                const targetYear = targetDate.getUTCFullYear();
                const targetMonth = targetDate.getUTCMonth();

                if (i === 0 && targetYear === startYear && targetMonth === startMonth) {
                    continue;
                }

                const exists = await this.entriesRepository.checkOccurrenceExists(fixed.id, targetYear, targetMonth);

                if (!exists) {
                    let newDate = new Date(Date.UTC(targetYear, targetMonth, dayToUse));
                    if (newDate.getUTCMonth() !== targetMonth) {
                        newDate = new Date(Date.UTC(targetYear, targetMonth + 1, 0));
                    }

                    const occurrencePayload: any = {
                        title: fixed.title,
                        value: fixed.value,
                        type: fixed.type,
                        date: newDate,
                        userId,
                        categoryId: fixed.categoryId!,
                        parentId: fixed.id
                    };
                    if (fixed.description) occurrencePayload.description = fixed.description;
                    if (fixed.goalId) occurrencePayload.goalId = fixed.goalId;

                    await this.entriesRepository.create(occurrencePayload);
                }
            }
        }

        return await this.entriesRepository.findAllByUserId(userId);
    }

    async updateEntry(
        id: string,
        userId: string,
        data: {
            title?: string
            description?: string
            value?: number
            type?: string
            date?: string
            categoryId?: string
            goalId?: string | null
            isFixed?: boolean
            repeatCount?: number | null
        }
    ) {
        const entry = await this.entriesRepository.findById(id, userId);
        if (!entry) {
            throw new Error("Lançamento não encontrado ou sem permissão");
        }

        if (data.isFixed === false && (entry as any).isFixed === true) {
            await this.entriesRepository.deleteChildEntries(id);
        }

        if (data.value !== undefined && (isNaN(Number(data.value)) || Number(data.value) <= 0)) {
            throw new Error("O valor do lançamento deve ser maior que zero");
        }

        if (data.categoryId !== undefined) {
            const category = await this.categoriesRepository.findById(data.categoryId, userId);
            if (!category) {
                throw new Error("Categoria não encontrada ou sem permissão");
            }
        }

        const effectiveType = data.type !== undefined ? data.type : entry.type;
        const effectiveGoalId = data.goalId !== undefined ? data.goalId : (entry as any).goalId;

        if (effectiveGoalId && effectiveType !== "income") {
            throw new Error("Somente lançamentos de receita podem ser atrelados a uma meta");
        }

        if (data.goalId) {
            const goal = await this.goalsRepository.findById(data.goalId, userId);
            if (!goal) {
                throw new Error("Meta não encontrada ou sem permissão");
            }

            const isNewAttachment = data.goalId !== (entry as any).goalId;
            if (isNewAttachment && this.isGoalCompleted(goal)) {
                throw new Error("Esta meta já foi concluída. Não é possível atrelar novos lançamentos a ela.");
            }
        }

        const updatePayload: any = {};
        if (data.title !== undefined) updatePayload.title = data.title;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.value !== undefined) updatePayload.value = data.value;
        if (data.type !== undefined) {
            if (data.type !== "income" && data.type !== "expenses") {
                throw new Error("Tipo inválido. Deve ser 'income' ou 'expenses'");
            }
            updatePayload.type = data.type as EntryType;
        }
        if (data.date !== undefined) updatePayload.date = new Date(data.date);
        if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId;
        if (data.goalId !== undefined) updatePayload.goalId = data.goalId;
        if (data.isFixed !== undefined) updatePayload.isFixed = data.isFixed;
        if (data.repeatCount !== undefined) updatePayload.repeatCount = data.repeatCount;

        const effectiveIsFixed = data.isFixed !== undefined ? data.isFixed : (entry as any).isFixed;
        if (effectiveIsFixed) {
            updatePayload.fixedDay = null;
        }

        if (effectiveIsFixed && data.repeatCount !== undefined && data.repeatCount !== null) {
            if (data.repeatCount < 1 || data.repeatCount > 12) {
                throw new Error("Informe quantas vezes o lançamento deve se repetir (1 a 12 meses)");
            }

            // Reduzir a repetição não pode deixar para trás ocorrências já geradas
            // além da nova quantidade — elas são excluídas, mantendo só as que
            // ainda cabem no novo total.
            const effectiveDate = data.date !== undefined ? new Date(data.date) : new Date((entry as any).date);
            const startYear = effectiveDate.getUTCFullYear();
            const startMonth = effectiveDate.getUTCMonth();
            const cutoff = new Date(Date.UTC(startYear, startMonth + data.repeatCount, 1));

            await this.entriesRepository.deleteChildEntriesFrom(id, cutoff);
        }

        if (effectiveType === "expenses" && data.goalId === undefined && (entry as any).goalId) {
            updatePayload.goalId = null;
        }

        return await this.entriesRepository.update(id, userId, updatePayload);
    }

    async deleteEntry(id: string, userId: string) {
        const entry = await this.entriesRepository.findById(id, userId);
        if (!entry) {
            throw new Error("Lançamento não encontrado ou sem permissão");
        }

        if ((entry as any).isFixed) {
            await this.entriesRepository.deleteChildEntries(id);
        }

        return await this.entriesRepository.delete(id, userId);
    }
}
