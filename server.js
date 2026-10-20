import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Configuração de caminhos para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. CRIAÇÃO DO SERVIDOR (Tem que vir antes das rotas!)
const app = express();
const PORT = process.env.PORT || 3001;
const URL_API = "https://api.groq.com/openai/v1/chat/completions";

const MODELO = "openai/gpt-oss-120b";

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 4. ROTA RAIZ (Agora o 'app' já existe e pode receber o .get!)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const usuarios = [];



app.post('/cadastro', (req, res) => {
    const { usuario, email, senha } = req.body;

    if (!usuario || !email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos!" });
    }

    if (senha.length < 6) {
        return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres!" });
    }

    const emailExiste = usuarios.find((busca) => busca.email.toLowerCase() === email.toLowerCase());

    if (emailExiste) {
        return res.status(409).json({ erro: "E-mail já cadastrado!" });
    }

    usuarios.push({ usuario, email, senha });
    console.log("Usuários no sistema:", usuarios);

    return res.status(201).json({ mensagem: "Cadastro realizado com sucesso!" });
});


app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "Preencha e-mail e senha para entrar!" });
    }

    const usuarioEncontrado = usuarios.find((busca) => busca.email.toLowerCase() === email.toLowerCase());

    if (!usuarioEncontrado || usuarioEncontrado.senha !== senha) {
        return res.status(401).json({ erro: "E-mail ou senha incorretos!" });
    }

    return res.json({
        mensagem: "Login realizado com sucesso!",
        usuario: usuarioEncontrado.usuario
    });
});


app.post('/chat', async (req, res) => {
    try {
        const API_KEY = process.env.GROQ_API_KEY;
        const historico = req.body.historico || [];

        const persona = [
            {
                role: "system",
                content: `Você é o Hulk responda de forma curta, bem humorada e objetiva `
            }
        ];

        persona.push(...historico);

        const respostaBruta = await fetch(URL_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODELO,
                messages: persona
            })
        });

        const resultado = await respostaBruta.json();

        if (!respostaBruta.ok) {
            console.log(" Erro retornado pela Groq:", resultado);
            return res.status(500).json({ erro: "Erro na comunicação com a Groq." });
        }

        return res.json({ resposta: resultado.choices[0].message.content });

    } catch (erro) {
        console.error(" Erro no servidor:", erro);
        return res.status(500).json({ erro: "Falha interna no servidor." });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(` Servidor rodando em http://localhost:${PORT}`);
});

export default app;