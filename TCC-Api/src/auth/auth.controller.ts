import { AuthService } from "./auth.service"
import type { FastifyReply, FastifyRequest } from "fastify"

export class AuthController {

    constructor(private authService: AuthService) { }

    // Cadastro
    async register(request: FastifyRequest, reply: FastifyReply) {

        try {

            const { name, email, password } = request.body as {
                name: string
                email: string
                password: string
            }

            const result = await this.authService.register(
                name,
                email,
                password
            )

            return reply.status(201).send(result)

        } catch (error: any) {

            return reply.status(400).send({
                message: error.message
            })

        }
    }

    // Login
    async login(request: FastifyRequest, reply: FastifyReply) {

        try {

            const { email, password } = request.body as {
                email: string
                password: string
            }

            const result = await this.authService.login(
                email,
                password
            )

            reply.setCookie("token", result.token, {
                httpOnly: true,
                secure: false, // localhost
                sameSite: "lax",
                path: "/"
            })

            return reply.status(200).send({
                user: result.user
            })

        } catch (error: any) {

            return reply.status(401).send({
                message: error.message
            })

        }
    }

    async me(request: FastifyRequest, reply: FastifyReply) {
        try {
            await request.jwtVerify();

            return reply.send(request.user);
        } catch {
            return reply.status(401).send({
                message: "Não autenticado"
            });
        }
    }

    async logout(request: FastifyRequest, reply: FastifyReply) {
        reply.clearCookie("token", { path: "/" });
        return reply.status(200).send({ message: "Logout realizado com sucesso" });
    }
}