// Serviço de metas: criação, listagem, atualização e exclusão.

import { GoalsRepository } from "./goals.repository"
import { prisma } from "../pluggins/prisma"

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

    async deleteGoal(id: string, userId: string) {
        const goal = await this.goalsRepository.findById(id, userId);
        if (!goal) {
            throw new Error("Meta não encontrada ou sem permissão");
        }

        // Os lançamentos vinculados à meta já compõem o saldo geral do usuário
        // (o vínculo com a meta é apenas uma marcação para acompanhar o progresso).
        // Por isso, ao excluir a meta, apenas desvinculamos os lançamentos —
        // eles continuam no histórico e no saldo normalmente, sem duplicar valores.
        await prisma.entry.updateMany({
            where: { goalId: id, userId },
            data: { goalId: null }
        });

        return await this.goalsRepository.delete(id, userId);
    }
}
