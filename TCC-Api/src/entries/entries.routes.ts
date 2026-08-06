import type { FastifyInstance } from "fastify"
import { EntriesController } from "./entries.controller"
import { EntriesService } from "./entries.service"
import { EntriesRepository } from "./entries.repository"
import { CategoriesRepository } from "../categories/categories.repository"
import { GoalsRepository } from "../goals/goals.repository"

export async function entriesRoutes(fastify: FastifyInstance) {

    const repository = new EntriesRepository()
    const categoriesRepository = new CategoriesRepository()
    const goalsRepository = new GoalsRepository()
    const service = new EntriesService(repository, categoriesRepository, goalsRepository)
    const controller = new EntriesController(service)

    fastify.post("/entries", controller.create.bind(controller))
    fastify.get("/entries", controller.list.bind(controller))
    fastify.put("/entries/:id", controller.update.bind(controller))
    fastify.delete("/entries/:id", controller.delete.bind(controller))
}
