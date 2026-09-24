// Repositório de lançamentos: operações CRUD e consultas específicas no banco via Prisma.

import { prisma } from "../pluggins/prisma"
import { EntryType } from "@prisma/client"

export class EntriesRepository {

    async create(data: {
        title: string,
        description?: string,
        value: number,
        type: EntryType,
        date: Date,
        userId: string,
        categoryId: string | null,
        goalId?: string,
        isFixed?: boolean,
        repeatCount?: number,
        parentId?: string
    }) {
        return await prisma.entry.create({
            data
        })
    }

    async findFixedEntries(userId: string) {
        return await prisma.entry.findMany({
            where: { userId, isFixed: true }
        })
    }

    async checkOccurrenceExists(parentId: string, year: number, month: number) {
        const startDate = new Date(Date.UTC(year, month, 1));
        const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

        const existing = await prisma.entry.findFirst({
            where: {
                parentId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        return existing !== null;
    }

    async findAllByUserId(userId: string) {
        return await prisma.entry.findMany({
            where: { userId },
            include: {
                category: true,
                goal: true
            },
            orderBy: { date: "desc" }
        })
    }

    async findById(id: string, userId: string) {
        return await prisma.entry.findFirst({
            where: { id, userId }
        })
    }

    async update(id: string, userId: string, data: any) {
        return await prisma.entry.update({
            where: { id },
            data,
            include: {
                category: true,
                goal: true
            }
        })
    }

    async findChildEntries(parentId: string) {
        return await prisma.entry.findMany({
            where: { parentId },
            orderBy: { date: "asc" }
        })
    }

    async addSkippedMonth(id: string, month: string) {
        return await prisma.entry.update({
            where: { id },
            data: { skippedMonths: { push: month } }
        })
    }

    // Transforma a repetição `nextId` no novo lançamento fixo da série e
    // exclui o fixo antigo, reapontando as demais repetições para ela.
    async promoteToFixed(
        oldId: string,
        nextId: string,
        data: { repeatCount: number, fixedDay: number, skippedMonths: string[] }
    ) {
        return await prisma.$transaction([
            prisma.entry.updateMany({
                where: { parentId: oldId, id: { not: nextId } },
                data: { parentId: nextId }
            }),
            prisma.entry.update({
                where: { id: nextId },
                data: { ...data, isFixed: true, parentId: null }
            }),
            prisma.entry.delete({ where: { id: oldId } })
        ])
    }

    async deleteChildEntries(parentId: string) {
        return await prisma.entry.deleteMany({
            where: { parentId }
        })
    }

    async deleteChildEntriesFrom(parentId: string, fromDate: Date) {
        return await prisma.entry.deleteMany({
            where: { parentId, date: { gte: fromDate } }
        })
    }

    async delete(id: string, userId: string) {
        return await prisma.entry.delete({
            where: { id }
        })
    }
}
