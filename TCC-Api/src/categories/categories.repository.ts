import { prisma } from "../pluggins/prisma"

export class CategoriesRepository {

    async create(data: { name: string, description?: string, color?: string, userId: string }) {
        return await prisma.category.create({
            data
        })
    }

    async findAllByUserId(userId: string) {
        return await prisma.category.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        })
    }

    async findById(id: string, userId: string) {
        return await prisma.category.findFirst({
            where: { id, userId }
        })
    }

    async findByName(name: string, userId: string) {
        return await prisma.category.findFirst({
            where: { name, userId }
        })
    }
}
