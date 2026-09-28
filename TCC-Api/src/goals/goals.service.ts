// Serviço de metas: criação, listagem, atualização e exclusão.

import { GoalsRepository } from "./goals.repository"
import { prisma } from "../pluggins/prisma"
import { isGoalCompleted, roundMoney } from "./goals.rules"

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

        const now = new Date();
        const entry = await prisma.entry.create({
            data: {
                title: `Guardado em ${goal.title}`,
                value: target,
                type: "income",
                date: new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
                userId,
                goalId: id
            }
        });

        return entry;
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
