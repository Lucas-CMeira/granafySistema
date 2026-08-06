// Repositório de metas: operações CRUD no banco via Prisma, incluindo lançamentos atrelados.

import { prisma } from "../pluggins/prisma"

export class GoalsRepository {

    async create(data: { title: string, description?: string, value: number, limitDate: Date, userId: string }) {
        return await prisma.goal.create({
            data
        })
    }

    async findAllByUserId(userId: string) {
        return await prisma.goal.findMany({
            where: { userId },
            include: {
                entries: true
            },
            orderBy: { limitDate: "asc" }
        })
    }

    async findById(id: string, userId: string) {
        return await prisma.goal.findFirst({
            where: { id, userId },
            include: {
                entries: true
            }
        })
    }

    async update(id: string, userId: string, data: { title?: string, description?: string, value?: number, limitDate?: Date }) {
        return await prisma.goal.update({
            where: { id },
            data
        })
    }

    async delete(id: string, userId: string) {
        return await prisma.goal.delete({
            where: { id }
        })
    }
}
