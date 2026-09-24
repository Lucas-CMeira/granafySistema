// Serviço de lançamentos: criação, listagem com sincronização de fixos mensais, atualização e exclusão.

import { EntriesRepository } from "./entries.repository"
import { CategoriesRepository } from "../categories/categories.repository"
import { GoalsRepository } from "../goals/goals.repository"
import { EntryType } from "@prisma/client"
import { isGoalCompleted } from "../goals/goals.rules"

const monthKeyOf = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

export class EntriesService {

    constructor(
        private entriesRepository: EntriesRepository,
        private categoriesRepository: CategoriesRepository,
        private goalsRepository: GoalsRepository
    ) { }

    async createEntry(
        title: string,
        description: string | undefined,
        value: number,
        type: string,
        date: Date,
        userId: string,
        categoryId: string | undefined,
        goalId: string | undefined,
        isFixed: boolean = false,
        repeatCount: number | undefined = undefined,
        parentId: string | undefined = undefined
    ) {
        if (value === undefined || !type || !date) {
            throw new Error("Valor, Tipo e Data são obrigatórios")
        }

        if (type !== "income" && type !== "expenses") {
            throw new Error("Tipo inválido. Deve ser 'income' ou 'expenses'")
        }

        let goal: Awaited<ReturnType<GoalsRepository["findById"]>> = null;
        if (goalId) {
            if (type !== "income") {
                throw new Error("Somente lançamentos de receita podem ser atrelados a uma meta");
            }
            goal = await this.goalsRepository.findById(goalId, userId);
            if (!goal) {
                throw new Error("Meta não encontrada ou sem permissão");
            }
            if (isGoalCompleted(goal)) {
                throw new Error("Esta meta já foi concluída. Não é possível atrelar novos lançamentos a ela.");
            }
        }

        const finalTitle = title?.trim() || (goal ? `Guardado em ${goal.title}` : "");
        if (!finalTitle) {
            throw new Error("Dê um título ao lançamento");
        }
        if (!categoryId && !goal) {
            throw new Error("Escolha uma categoria");
        }

        if (isNaN(Number(value)) || Number(value) <= 0) {
            throw new Error("O valor do lançamento deve ser maior que zero")
        }

        if (isNaN(date.getTime())) {
            throw new Error("Data inválida")
        }

        if (categoryId) {
            const category = await this.categoriesRepository.findById(categoryId, userId);
            if (!category) {
                throw new Error("Categoria não encontrada ou sem permissão");
            }
        }

        if (isFixed && (!repeatCount || repeatCount < 1 || repeatCount > 12)) {
            throw new Error("Informe quantas vezes o lançamento deve se repetir (1 a 12 meses)");
        }

        const payload: any = {
            title: finalTitle,
            value,
            type: type as EntryType,
            date,
            userId,
            categoryId: categoryId || null
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

                // Mês cuja repetição o usuário excluiu individualmente.
                if (fixed.skippedMonths.includes(monthKeyOf(targetDate))) {
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
                        categoryId: fixed.categoryId,
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
            categoryId?: string | null
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

        if (data.categoryId) {
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

        let goal: Awaited<ReturnType<GoalsRepository["findById"]>> = null;
        if (effectiveGoalId) {
            goal = await this.goalsRepository.findById(effectiveGoalId, userId);
            if (!goal) {
                throw new Error("Meta não encontrada ou sem permissão");
            }

            const isNewAttachment = effectiveGoalId !== (entry as any).goalId;
            if (isNewAttachment && isGoalCompleted(goal)) {
                throw new Error("Esta meta já foi concluída. Não é possível atrelar novos lançamentos a ela.");
            }
        }

        const effectiveCategoryId = data.categoryId !== undefined ? data.categoryId : entry.categoryId;
        if (!effectiveCategoryId && !goal) {
            throw new Error("Escolha uma categoria");
        }

        const updatePayload: any = {};
        if (data.title !== undefined) {
            const title = data.title.trim() || (goal ? `Guardado em ${goal.title}` : "");
            if (!title) {
                throw new Error("Dê um título ao lançamento");
            }
            updatePayload.title = title;
        }
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.value !== undefined) updatePayload.value = data.value;
        if (data.type !== undefined) {
            if (data.type !== "income" && data.type !== "expenses") {
                throw new Error("Tipo inválido. Deve ser 'income' ou 'expenses'");
            }
            updatePayload.type = data.type as EntryType;
        }
        if (data.date !== undefined) updatePayload.date = new Date(data.date);
        if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId || null;
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

    // scope "single": exclui só o mês deste lançamento, mantendo os demais
    // meses da repetição. scope "all": exclui o lançamento fixo inteiro.
    async deleteEntry(id: string, userId: string, scope: "single" | "all" = "all") {
        const entry = await this.entriesRepository.findById(id, userId);
        if (!entry) {
            throw new Error("Lançamento não encontrado ou sem permissão");
        }

        const parent = entry.parentId
            ? await this.entriesRepository.findById(entry.parentId, userId)
            : null;

        if (scope === "single") {
            if (parent) {
                // Marca o mês como pulado para a sincronização não recriá-lo.
                await this.entriesRepository.addSkippedMonth(parent.id, monthKeyOf(entry.date));
                return await this.entriesRepository.delete(id, userId);
            }

            if (entry.isFixed) {
                // O próprio fixo é o primeiro mês da série: a próxima repetição
                // assume o papel de lançamento fixo pelos meses que restam.
                const [next] = await this.entriesRepository.findChildEntries(id);
                if (!next) {
                    return await this.entriesRepository.delete(id, userId);
                }

                const monthsAhead =
                    (next.date.getUTCFullYear() - entry.date.getUTCFullYear()) * 12 +
                    (next.date.getUTCMonth() - entry.date.getUTCMonth());

                return await this.entriesRepository.promoteToFixed(entry.id, next.id, {
                    repeatCount: Math.max(1, (entry.repeatCount ?? 12) - monthsAhead),
                    fixedDay: entry.fixedDay ?? entry.date.getUTCDate(),
                    skippedMonths: entry.skippedMonths,
                });
            }

            return await this.entriesRepository.delete(id, userId);
        }

        const root = parent ?? entry;
        if (root.isFixed) {
            await this.entriesRepository.deleteChildEntries(root.id);
        }

        return await this.entriesRepository.delete(root.id, userId);
    }
}
