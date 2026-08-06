// Controller de metas: recebe as requisições HTTP e delega ao serviço.

import type { FastifyReply, FastifyRequest } from "fastify"
import { GoalsService } from "./goals.service"

export class GoalsController {

    constructor(private goalsService: GoalsService) { }

    async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
            const { sub: userId } = request.user as { sub: string };

            const { title, description, value, limitDate } = request.body as {
                title: string
                description?: string
                value: number
                limitDate: string
            }

            const goal = await this.goalsService.createGoal(
                title,
                description,
                value,
                new Date(limitDate),
                userId
            );

            return reply.status(201).send(goal);

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

            const goals = await this.goalsService.getGoals(userId);

            return reply.status(200).send(goals);

        } catch (error: any) {
            return reply.status(400).send({
                message: error.message
            });
        }
    }

    async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
            const { sub: userId } = request.user as { sub: string };
            const { id } = request.params as { id: string };

            const body = request.body as {
                title?: string
                description?: string
                value?: number
                limitDate?: string
            }

            const data: { title?: string; description?: string; value?: number; limitDate?: string } = {};
            if (body.title !== undefined) data.title = body.title;
            if (body.description !== undefined) data.description = body.description;
            if (body.value !== undefined) data.value = body.value;
            if (body.limitDate !== undefined) data.limitDate = body.limitDate;

            const goal = await this.goalsService.updateGoal(id, userId, data);

            return reply.status(200).send(goal);

        } catch (error: any) {
            return reply.status(400).send({
                message: error.message
            });
        }
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
            const { sub: userId } = request.user as { sub: string };
            const { id } = request.params as { id: string };

            await this.goalsService.deleteGoal(id, userId);

            return reply.status(204).send();

        } catch (error: any) {
            return reply.status(400).send({
                message: error.message
            });
        }
    }
}
