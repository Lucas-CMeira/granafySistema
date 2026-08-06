// Controller de lançamentos: recebe as requisições HTTP e delega ao serviço.

import type { FastifyReply, FastifyRequest } from "fastify"
import { EntriesService } from "./entries.service"

export class EntriesController {

    constructor(private entriesService: EntriesService) { }

    async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();
            const { sub: userId } = request.user as { sub: string };

            const { title, description, value, type, date, categoryId, goalId, isFixed, fixedDay } = request.body as {
                title: string
                description?: string
                value: number
                type: string
                date: string
                categoryId: string
                goalId?: string
                isFixed?: boolean
                fixedDay?: number
            }

            const entry = await this.entriesService.createEntry(
                title,
                description,
                value,
                type,
                new Date(date),
                userId,
                categoryId,
                goalId,
                isFixed,
                fixedDay
            );

            return reply.status(201).send(entry);

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

            const entries = await this.entriesService.getEntries(userId);

            return reply.status(200).send(entries);

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
                type?: string
                date?: string
                categoryId?: string
                goalId?: string | null
                isFixed?: boolean
                fixedDay?: number | null
            }

            const updatedEntry = await this.entriesService.updateEntry(id, userId, body);

            return reply.status(200).send(updatedEntry);

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

            await this.entriesService.deleteEntry(id, userId);

            return reply.status(204).send();

        } catch (error: any) {
            return reply.status(400).send({
                message: error.message
            });
        }
    }
}
