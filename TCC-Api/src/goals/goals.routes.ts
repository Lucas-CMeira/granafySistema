import type { FastifyInstance } from "fastify"
import { GoalsController } from "./goals.controller"
import { GoalsService } from "./goals.service"
import { GoalsRepository } from "./goals.repository"

export async function goalsRoutes(fastify: FastifyInstance) {

    const repository = new GoalsRepository()
    const service = new GoalsService(repository)
    const controller = new GoalsController(service)

    fastify.post("/goals", controller.create.bind(controller))
    fastify.get("/goals", controller.list.bind(controller))
    fastify.put("/goals/:id", controller.update.bind(controller))
    fastify.delete("/goals/:id", controller.delete.bind(controller))
}
