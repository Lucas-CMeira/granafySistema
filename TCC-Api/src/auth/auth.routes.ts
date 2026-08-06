
import type { FastifyInstance } from "fastify";
import { AuthModule } from "./auth.module";
import { authMiddleware } from "../middlewares/auth";

export async function authRoutes(app: FastifyInstance) {

    const authModule = new AuthModule(app)

    const authController = authModule.authController

    app.post(
        "/register",
        authController.register.bind(authController)
    )

    app.post(
        "/login",
        authController.login.bind(authController)
    )

    app.get(
        "/me",
        {
            preHandler: async (request) => {
                await request.jwtVerify()
            }
        },
        authController.me.bind(authController)
    )

    app.post(
        "/logout",
        authController.logout.bind(authController)
    )

}