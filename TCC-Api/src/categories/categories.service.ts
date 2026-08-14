// Regras de negocios lógico

import { CategoriesRepository } from "./categories.repository"

const DEFAULT_CATEGORIES = [
    { name: "Alimentação", color: "F59E0B" },
    { name: "Salário", color: "10B981" },
    { name: "Pessoal", color: "8B5CF6" },
    { name: "Casa", color: "3B82F6" },
    { name: "Fatura do Cartão", color: "EF4444" },
    { name: "Outros", color: "6B7280" },
]

export class CategoriesService {

    constructor(private categoriesRepository: CategoriesRepository) { }

    async createCategory(name: string, description: string | undefined, color: string | undefined, userId: string) {
        if (!name) {
            throw new Error("O nome da categoria é obrigatório")
        }

        const existing = await this.categoriesRepository.findByName(name.trim(), userId);
        if (existing) {
            return existing;
        }

        const payload: any = { name: name.trim(), userId };
        if (description) payload.description = description;
        if (color) payload.color = color;

        return await this.categoriesRepository.create(payload);
    }

    async getCategories(userId: string) {
        return await this.categoriesRepository.findAllByUserId(userId)
    }

    async seedDefaultCategories(userId: string) {
        const existing = await this.categoriesRepository.findAllByUserId(userId)
        if (existing.length > 0) return;

        for (const cat of DEFAULT_CATEGORIES) {
            await this.categoriesRepository.create({ name: cat.name, color: cat.color, userId })
        }
    }
}
