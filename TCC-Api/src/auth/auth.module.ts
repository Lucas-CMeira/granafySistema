/*
    é um arquivo responsavel por gerenciar as camadas: controller, repository e service
*/


import type { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

export class AuthModule {

    public authController: AuthController

    private authService: AuthService
    private authRepository: AuthRepository

    constructor(app: FastifyInstance) {

        this.authRepository = new AuthRepository()

        this.authService = new AuthService(
            this.authRepository,
            app
        )

        this.authController = new AuthController(
            this.authService
        )
    }
}