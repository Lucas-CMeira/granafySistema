import 'dotenv/config'
import buildApp from "./bootstrap";

async function start(){

    const app = await buildApp()

    const port = process.env.PORT

    if(!port) throw new Error("[ENV] -> Variável de ambiente não definida: PORT")

    app.listen({
        host: "0.0.0.0",
        port: Number(port)
    }).then(() => {
        console.log("HTTP Server running on ", port, " port")
    }).catch((e: any) => {
        console.log("Erro na hora de subir")
        console.log(e)
    })
}

start()