import type { FastifyReply, FastifyRequest } from "fastify"
import { CategoriesService } from "./categories.service"

export class CategoriesController {

    constructor(private categoriesService: CategoriesService) { }

    async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
            const { sub: userId } = request.user as { sub: string };

            const { name, description, color } = request.body as {
                name: string
                description?: string
                color?: string
            }

            const category = await this.categoriesService.createCategory(name, description, color, userId);

            return reply.status(201).send(category);

        } catch (error: any) {
            return reply.status(400).send({
                message: error.message
            });
        }
    }

    async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
            const { sub: userId } = request.user as { sub: string };

            // Garante que usuários novos já tenham as categorias padrão
            await this.categoriesService.seedDefaultCategories(userId);

            const categories = await this.categoriesService.getCategories(userId);

            return reply.status(200).send(categories);

        } catch (error: any) {
            return reply.status(400).send({
                message: error.message
            });
        }
    }
}

