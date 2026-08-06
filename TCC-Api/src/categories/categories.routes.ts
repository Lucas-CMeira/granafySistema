import type { FastifyInstance } from "fastify"
import { CategoriesController } from "./categories.controller"
import { CategoriesService } from "./categories.service"
import { CategoriesRepository } from "./categories.repository"

export async function categoriesRoutes(fastify: FastifyInstance) {

    const repository = new CategoriesRepository()
    const service = new CategoriesService(repository)
    const controller = new CategoriesController(service)

    fastify.post("/categories", controller.create.bind(controller))
    fastify.get("/categories", controller.list.bind(controller))
}
