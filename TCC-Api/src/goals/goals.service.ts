// Serviço de metas: criação, listagem, atualização e exclusão.

import { GoalsRepository } from "./goals.repository"
import { prisma } from "../pluggins/prisma"
import { isGoalCompleted, roundMoney, startOfNextMonth } from "./goals.rules"

export class GoalsService {

    constructor(private goalsRepository: GoalsRepository) { }

    async createGoal(title: string, description: string | undefined, value: number, limitDate: Date, userId: string) {
        if (!title || !value || !limitDate) {
            throw new Error("Título, Valor e Data Limite são obrigatórios")
        }

        if (isNaN(Number(value)) || Number(value) <= 0) {
            throw new Error("O valor objetivo da meta deve ser maior que zero")
        }

        if (isNaN(limitDate.getTime())) {
            throw new Error("Data limite inválida")
        }

        const payload: any = { title, value, limitDate, userId };
        if (description) payload.description = description;

        return await this.goalsRepository.create(payload);
    }

    async getGoals(userId: string) {
        return await this.goalsRepository.findAllByUserId(userId)
    }

    async updateGoal(
        id: string,
        userId: string,
        data: { title?: string, description?: string, value?: number, limitDate?: string }
    ) {
        const goal = await this.goalsRepository.findById(id, userId);
        if (!goal) {
            throw new Error("Meta não encontrada ou sem permissão");
        }

        if (data.value !== undefined && (isNaN(Number(data.value)) || Number(data.value) <= 0)) {
            throw new Error("O valor objetivo da meta deve ser maior que zero");
        }

        if (
            data.value !== undefined &&
            Number(data.value) < goal.value &&
            isGoalCompleted(goal)
        ) {
            throw new Error("Esta meta já foi concluída. O valor objetivo só pode ser aumentado, não reduzido.");
        }

        if (data.limitDate !== undefined && isNaN(new Date(data.limitDate).getTime())) {
            throw new Error("Data limite inválida");
        }

        const updatePayload: any = {};
        if (data.title) updatePayload.title = data.title;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.value !== undefined) updatePayload.value = data.value;
        if (data.limitDate !== undefined) updatePayload.limitDate = new Date(data.limitDate);

        return await this.goalsRepository.update(id, userId, updatePayload);
    }

    // Guarda `amount` do saldo disponível do mês na meta (sugestão da home).
    // O saldo disponível é formado pelas receitas sem meta, então o valor é
    // "movido" delas: receitas que cabem inteiras são atreladas à meta; a que
    // sobra é dividida em duas (uma parte continua livre, a outra vai para a
    // meta). Diferente de lançar uma receita nova já atrelada à meta pela tela
    // de lançamentos, que não mexe no saldo disponível.
    async depositToGoal(id: string, userId: string, amount: number) {
        const target = roundMoney(Number(amount));
        if (isNaN(target) || target <= 0) {
            throw new Error("Informe um valor maior que zero");
        }

        const goal = await this.goalsRepository.findById(id, userId);
        if (!goal) {
            throw new Error("Meta não encontrada ou sem permissão");
        }
        if (isGoalCompleted(goal)) {
            throw new Error("Esta meta já foi concluída. Não é possível atrelar novos lançamentos a ela.");
        }

        // Só conta o que já caiu até o mês atual.
        const entries = await prisma.entry.findMany({
            where: { userId, date: { lt: startOfNextMonth() } },
            orderBy: { date: "asc" }
        });

        const freeIncome = entries.filter((entry) => entry.type === "income" && !entry.goalId);
        const available = roundMoney(
            freeIncome.reduce((total, entry) => total + entry.value, 0) -
            entries
                .filter((entry) => entry.type === "expenses")
                .reduce((total, entry) => total + entry.value, 0)
        );

        if (target > available) {
            throw new Error(
                `Você tem R$ ${available.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} disponíveis para guardar.`
            );
        }

        // Lançamentos fixos por último, para não transformar o modelo da
        // repetição num lançamento de meta sem necessidade.
        const candidates = [
            ...freeIncome.filter((entry) => !entry.isFixed),
            ...freeIncome.filter((entry) => entry.isFixed),
        ];

        await prisma.$transaction(async (tx) => {
            let remaining = target;

            for (const entry of candidates) {
                if (remaining <= 0) break;

                if (entry.value <= remaining) {
                    await tx.entry.update({ where: { id: entry.id }, data: { goalId: id, fromDeposit: true } });
                    remaining = roundMoney(remaining - entry.value);
                    continue;
                }

                await tx.entry.update({
                    where: { id: entry.id },
                    data: { value: roundMoney(entry.value - remaining) }
                });
                await tx.entry.create({
                    data: {
                        title: entry.title,
                        description: entry.description,
                        value: remaining,
                        type: "income",
                        date: entry.date,
                        userId,
                        categoryId: entry.categoryId,
                        goalId: id,
                        fromDeposit: true
                    }
                });
                remaining = 0;
            }
        });

        return { amount: target };
    }

    async deleteGoal(id: string, userId: string) {
        const goal = await this.goalsRepository.findById(id, userId);
        if (!goal) {
            throw new Error("Meta não encontrada ou sem permissão");
        }


        await prisma.entry.updateMany({
            where: { goalId: id, userId },
            data: { goalId: null }
        });

        return await this.goalsRepository.delete(id, userId);
    }
}
