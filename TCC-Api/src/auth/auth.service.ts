import bcrypt from 'bcrypt'
import { AuthRepository } from './auth.repository'
import type { FastifyInstance } from 'fastify';


export class AuthService {

    constructor(private authRepository: AuthRepository,
        private app: FastifyInstance
    ) { }

    async register(name: string, email: string, password: string) {

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!name || !name.trim()) {
            throw new Error("O nome é obrigatório");
        }

        if (!emailRegex.test(email)) {
            throw new Error("Email inválido");
        }

        // A regra de tamanho mínimo existia apenas no formulário do front, então
        // qualquer requisição direta à API criava conta com senha de 1 caractere.
        if (!password || password.length < 6) {
            throw new Error("A senha deve ter pelo menos 6 caracteres");
        }

        const userAlreadyExists =
            await this.authRepository.findByEmail(email);

        if (userAlreadyExists) {
            throw new Error("Email já está em uso!");
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user =
            await this.authRepository.create({
                name,
                email,
                password: hashedPassword
            });

        return {
            id: user.id,
            name: user.name,
            email: user.email
        };
    }   
    async login(email: string, password: string) {

        const user = await this.authRepository.findByEmail(email);

        if (!user) {
            throw new Error("Credenciais Inválidas!")
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            throw new Error("Credenciais Inválidas!")
        }

        const token = this.app.jwt.sign({
            sub: user.id,
            name: user.name,
            email: user.email
        });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };
    }

}