import express from 'express'; 
import admin from 'firebase-admin'; 
import cors from 'cors'; 
import fs from 'fs'; 
import axios from 'axios'; 
import path from 'path'; 
import { fileURLToPath } from 'url'; 
import multer from 'multer';
import moment from 'moment-timezone';
import dotenv from 'dotenv'; 
import nodemailer from 'nodemailer';
import { assert, error } from 'console';
import { type } from 'os';
dotenv.config(); 

const DIFY_API_KEY = process.env.DIFY_API_KEY; 
const PORT = process.env.PORT || 2052;

const app = express();

// Configuração do CORS
app.use(cors());

// Configuração para servir arquivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));

// Configurar o storage do Multer para definir o destino e o nome dos arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folderPath = path.join(__dirname, 'img');
        // Verifica se a pasta existe, caso contrário, cria
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        // Define o nome do arquivo como o timestamp e o nome original
        cb(null, Date.now() + path.extname(file.originalname));
    }
});


// Inicializar o Multer com a configuração de storage
const upload = multer({ storage: storage });

// rota para pagina de pagamentos 
app.get('/api/pagamentos-cursos', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pagamento.html'));
})

app.get('/api/pagamentos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pagamentos-cursos.html'));
})


app.get('/api/pagina-inicial', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/api/lista-alunos', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'lista-alunos.html'))
})
app.get('/api/cursos', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cursos.html'))
})
app.get('/api/contatos', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contato.html'))
})
app.get('/api/sobre', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sobre.html'))
})

// Lendo o arquivo JSON de configuração do Firebase
const serviceAccount = JSON.parse(fs.readFileSync('./public/firebaseConfig.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://denny-language-school.firebaseio.com',
});

const db = admin.firestore(); 

app.use(express.json());
app.use(cors());

// Middleware de Autenticação via API Key (Busca no Firestore)
const authenticate = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-apikey'];
        if (!apiKey) return res.status(400).json({ error: "O parâmetro 'x-apikey' é necessário!" });

        // Buscar usuário pelo API Key no Firestore
        const apiKeysRef = db.collection('apiKeys');
        const snapshot = await apiKeysRef.where('apiKey', '==', apiKey).get();

        if (snapshot.empty) return res.status(403).json({ error: "API Key inválida ou não registrada!" });

        req.user = snapshot.docs[0].data().userId; // ID do usuário autenticado
        next();
    } catch (error) {
        console.error("Erro na autenticação:", error);
        res.status(500).json({ error: "Erro na autenticação da API Key." });
    }
};

// Definir a chave de API da OpenWeather
const WEATHER_API_KEY = process.env.WEATHER_API_KEY; // Coloque sua chave da OpenWeather

app.get('/api/weather', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'O parâmetro "query" (cidade) é obrigatório!' });
        }

        // Fazer a requisição para a OpenWeather API
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: query, // Cidade passada pelo usuário
                appid: WEATHER_API_KEY, // Sua chave de API
                units: 'metric', // Unidades de medida em Celsius
                lang: 'pt_br' // Para retornar em português
            }
        });

        // Extrair as informações necessárias da resposta
        const weatherData = response.data;
        const weatherInfo = {
            name: "api de clima",
            version: "1.1.0",
            author: "Eliobros Tech",
            description: "",
            cidade: weatherData.name,
            maxima: weatherData.main.temp_max, // Temperatura máxima
            minima: weatherData.main.temp_min, // Temperatura mínima
            estado: weatherData.weather[0].description // Descrição do clima (ex: parcialmente nublado)
        };

        // Enviar a resposta com as informações do clima
        res.json(weatherInfo);
    } catch (error) {
        console.error('Erro ao buscar clima:', error);
        res.status(500).json({ error: 'Erro ao buscar clima' });
    }
});

// Rota GET para listar as imagens
app.get('/api/imagens', (req, res) => {
    const dirPath = path.join(__dirname, 'img');

    fs.readdir(dirPath, (err, files) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao ler as imagens.' });
        }

        // Filtra só arquivos de imagem
        const imageFiles = files.filter(file =>
            file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.webp')
        );

        // Monta as URLs completas (ajuste seu domínio se necessário)
        const imageUrls = imageFiles.map(filename => `https://api-vercel-production.up.railway.app/img/${filename}`);

        res.json({ imagens: imageUrls });
    });
});


app.get('/api/check-hours', (req, res) => {
     
        // Configurar o fuso horário para Maputo
    const timeMaputo = moment.tz("Africa/Maputo");

    // Formatar a hora (hora, minutos e segundos)
    const hora = timeMaputo.format('HH:mm:ss');
    const data = timeMaputo.format('D [de] MMMM [de] YYYY');

    res.json({
        hora: hora,
        data: data
    });

   
    atualizarHora( setInterval(1000));

    
});


app.get('/api/confirmar-pagamento', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'confirmar-pagamento.html'));
})

app.get('/api/get-hours', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'get-hours.html'));
})

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

app.get('/api/search-images', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: 'O parâmetro "query" é obrigatório!' });
        }

        const resposta_pesonalizada = {
            name: "Denny Language School API",
            version: "1.1.1",
            author: "Eliobros Tech",
            description: "API para buscar imagens",
        }

        const response = await axios.get(`https://api.unsplash.com/search/photos`, {
            params: {
                query,
                per_page: 5, // Retorna 5 imagens
                client_id: UNSPLASH_ACCESS_KEY
            }
        });

        const images = response.data.results.map(img => ({
            title: img.alt_description || 'Sem título',
            imageUrl: img.urls.small
        }));

        res.json({resposta_pesonalizada, query, images });
    } catch (error) {
        console.error('Erro ao buscar imagens:', error);
        res.status(500).json({ error: 'Erro ao buscar imagens' });
    }
});

app.get('/api', (req, res) => {
    const isActive = true;
    const response = {
        name: "Denny Language School API",
        version: "1.2.1",
        author: "Denny",
        description: "API to manage students and classes",
        status: isActive ? "Online" : "Offline"

    };
    res.json(response);
});

app.get('/api/generate-api-key', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'generate-api-key.html'));
});


// Caminho da pasta de dados e do arquivo apikeys.json
const dadosDir = path.join(__dirname, 'dados');
const apiKeysFile = path.join(dadosDir, 'apikeys.json');

// Função para gerar a chave de API
function generateApiKey() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Função para garantir que a pasta e o arquivo existam
const ensureFileExists = () => {
    // Se a pasta dados não existir, cria-a
    if (!fs.existsSync(dadosDir)) {
        fs.mkdirSync(dadosDir);
    }

    // Se o arquivo apikeys.json não existir, cria um arquivo vazio
    if (!fs.existsSync(apiKeysFile)) {
        fs.writeFileSync(apiKeysFile, JSON.stringify([]));  // Inicializa como um array vazio
    }
};

// Rota para gerar a chave de API
app.post('/generate-key', async (req, res) => {
    const { userName, apiName } = req.body;
    console.log('Solicitação para gerar chave API:', userName, apiName);  // Log para depuração

    if (!userName || !apiName) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    try {
        // Gerar a chave de API
        const apiKey = generateApiKey();  // Função para gerar chave
        const timestamp = new Date().toISOString();  // Timestamp atual

        // Garantir que a pasta e o arquivo existam
        ensureFileExists();

        // Ler o arquivo apikeys.json e adicionar a nova chave de API
        const apiKeysData = JSON.parse(fs.readFileSync(apiKeysFile));

        // Adicionar nova chave de API ao array
        apiKeysData.push({
            apiKey,
            apiName,
            userName,
            timestamp
        });

        // Escrever novamente o arquivo com a chave de API adicionada
        fs.writeFileSync(apiKeysFile, JSON.stringify(apiKeysData, null, 2));

        console.log('Chave gerada e salva no arquivo:', apiKey);  // Log de sucesso
        res.json({ apiKey });
    } catch (error) {
        console.error('Erro ao gerar a chave de API:', error);  // Log de erro
        res.status(500).json({ error: "Erro ao gerar a chave de API." });
    }
});

// Função de validação da chave de API
const validateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];  // O cabeçalho da requisição contém a chave de API

        if (!apiKey) {
            return res.status(400).json({ error: 'A chave de API é obrigatória!' });
        }

        // Garantir que o arquivo apikeys.json exista
        ensureFileExists();

        // Ler o arquivo apikeys.json
        const apiKeysData = JSON.parse(fs.readFileSync(apiKeysFile));

        // Verificar se a chave de API existe no arquivo
        const apiKeyData = apiKeysData.find(item => item.apiKey === apiKey);

        if (!apiKeyData) {
            return res.status(401).json({ error: 'Chave de API inválida!' });
        }

        // Se a chave for válida, adicione a informação do usuário à requisição
        req.apiKeyData = apiKeyData;  // Salve as informações da chave se precisar usá-las
        next();  // Prossiga para o próximo middleware ou a lógica da rota
    } catch (error) {
        console.error('Erro ao validar a chave de API:', error);
        res.status(500).json({ error: 'Erro ao validar a chave de API' });
    }
};

// Rota de exemplo para testar a validação da chave de API
app.get('/test-api', validateApiKey, (req, res) => {
    res.json({ message: 'Requisição bem-sucedida! Chave de API válida.', apiKeyData: req.apiKeyData });
});


// Rota para receber o upload de captura de tela
app.post('/upload-captura', upload.single('screenshot'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhuma captura de tela foi enviada.' });
    }

    // Caminho do arquivo salvo
    const filePath = path.join(__dirname, 'img', req.file.filename);
    
    res.json({ message: 'Captura de tela recebida', filePath });
});

// Rota para receber as imagens
app.post('/upload-docs', upload.fields([{ name: 'fotoFrente', maxCount: 1 }, { name: 'fotoVerso', maxCount: 1 }]), (req, res) => {
    // Verificar se as imagens foram enviadas
    if (!req.files || !req.files.fotoFrente || !req.files.fotoVerso) {
        return res.status(400).json({ success: false, message: 'Ambas as fotos do documento são obrigatórias.' });
    }

    // Se as imagens foram recebidas, você pode manipulá-las ou salvar no banco de dados se necessário.
    console.log('Foto da Frente:', req.files.fotoFrente[0].path);
    console.log('Foto do Verso:', req.files.fotoVerso[0].path);

    // Resposta de sucesso
    return res.status(200).json({
        success: true,
        message: 'Documento enviado com sucesso!',
        data: {
            fotoFrente: `/img/${req.files.fotoFrente[0].filename}`,
            fotoVerso: `/img/${req.files.fotoVerso[0].filename}`
        }
    });
});

app.get('/api/tina/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
})

//acessar a tina pela web

app.get('/api/tina/messages', validateApiKey, async (req, res) => {
    try {
        const { query } = req.query;
        const user = "Joao123";  // Usuário fixo para teste

        if (!query) return res.status(400).json({ error: 'O campo query é obrigatório!' });

        // Garantir que o arquivo apikeys.json exista
        ensureFileExists();

        // Ler o arquivo apikeys.json para buscar o conversation_id do usuário
        const apiKeysData = JSON.parse(fs.readFileSync(apiKeysFile));
        const userApiKeyData = apiKeysData.find(item => item.userName === user);

        let conversation_id;

        if (userApiKeyData && userApiKeyData.conversation_id) {
            conversation_id = userApiKeyData.conversation_id;
        } else {
            // Primeira mensagem: Criar um novo conversation_id
            const initResponse = await axios.post(
                'https://api.dify.ai/v1/chat-messages',
                { query, user, response_mode: "blocking", inputs: {} },
                {
                    headers: {
                        'Authorization': `Bearer ${DIFY_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            conversation_id = initResponse.data.conversation_id;

            // Salvar o conversation_id no arquivo apikeys.json
            userApiKeyData.conversation_id = conversation_id;
            fs.writeFileSync(apiKeysFile, JSON.stringify(apiKeysData, null, 2));

            return res.json(initResponse.data);
        }

        // Enviar mensagem usando o conversation_id salvo
        const response = await axios.post(
            'https://api.dify.ai/v1/chat-messages',
            { query, user, conversation_id, response_mode: "blocking", inputs: {} },
            {
                headers: {
                    'Authorization': `Bearer ${DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.status(500).json({ error: 'Erro ao conectar com a API da Dify' });
    }
})
import { GoogleGenAI } from '@google/genai';

dotenv.config()
const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY  || "API KEY NAO DEFINIDA"; // Coloque sua chave da API do Google GenAI
// Inicializando o GoogleGenAI com a chave da API
const ai = new GoogleGenAI({ apiKey: GOOGLE_GENAI_API_KEY });

// Middleware para processar o corpo da requisição como JSON (não precisa mais do body-parser)
app.use(express.json());

// Rota para processar GET e POST em /api/chat/messages
app.route('/api/chat/messages')
  // Requisição GET
  .get(async (req, res) => {
    const message = req.query.message || req.quey.query || 'Qual é a capital de Moçambique?';  // Mensagem default

    try {
      // Fazendo a chamada à API do Google GenAI
      const response = await ai.models.generateContent({
        vertexai: true,
        model: "gemini-2.0-flash", 
        contents: message
      });

    
      const agora = new Date();
const horaFormatada = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}:${String(agora.getSeconds()).padStart(2, '0')}`;

const result = {
  modelo: "gemini-2.0-flash",
  resposta: response.text,
  dia: agora.getDate(),
  mes: agora.getMonth() + 1,
  ano: agora.getFullYear(),
  hora: horaFormatada
};


      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao processar a requisição', details: error.message });
    }
  })
  // Requisição POST
  .post(async (req, res) => {
    const message = req.body.message || req.query.query || 'Qual é a capital de Moçambique?';  // Mensagem default

    try {
      // Fazendo a chamada à API do Google GenAI
      const response = await ai.models.generateContent({
        vertexai: true,
        model: "gemini-2.0-flash", 
        contents: message
      });
      const agora = new Date();
      const horaFormatada = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}:${String(agora.getSeconds()).padStart(2, '0')}`;
      
      const result = {
        modelo: "gemini-2.0-flash",
        resposta: response.text,
        dia: agora.getDate(),
        mes: agora.getMonth() + 1,
        ano: agora.getFullYear(),
        hora: horaFormatada
      };
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao processar a requisição', details: error.message });
    }
  });
// Rota para enviar mensagens para a Tina
app.post('/api/tina/messages', validateApiKey, authenticate, async (req, res) => {
    try {
        const { query } = req.body;
        const user = req.user;  // O usuário autenticado pela função `authenticate`

        if (!query) return res.status(400).json({ error: 'O campo query é obrigatório!' });

        // Garantir que o arquivo apikeys.json exista
        ensureFileExists();

        // Ler o arquivo apikeys.json para buscar o conversation_id do usuário
        const apiKeysData = JSON.parse(fs.readFileSync(apiKeysFile));
        const userApiKeyData = apiKeysData.find(item => item.userName === user);

        let conversation_id;

        if (userApiKeyData && userApiKeyData.conversation_id) {
            conversation_id = userApiKeyData.conversation_id;
        } else {
            // Primeira mensagem: Criar um novo conversation_id
            const initResponse = await axios.post(
                'https://api.dify.ai/v1/chat-messages',
                { query, user, response_mode: "blocking", inputs: {} },
                {
                    headers: {
                        'Authorization': `Bearer ${DIFY_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            conversation_id = initResponse.data.conversation_id;

            // Salvar o conversation_id no arquivo apikeys.json
            userApiKeyData.conversation_id = conversation_id;
            fs.writeFileSync(apiKeysFile, JSON.stringify(apiKeysData, null, 2));

            return res.json(initResponse.data);
        }

        // Enviar mensagem usando o conversation_id salvo
        const response = await axios.post(
            'https://api.dify.ai/v1/chat-messages',
            { query, user, conversation_id, response_mode: "blocking", inputs: {} },
            {
                headers: {
                    'Authorization': `Bearer ${DIFY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.status(500).json({ error: 'Erro ao conectar com a API da Dify' });
    }
});

// Rota para salvar dados textuais no Firestore
app.post('/api/save-data', async (req, res) => {
    const { name, birth, nacionalidade, civilState, documentos, docNumber, Distrito, Bairro, houseNumber, quarterNumber, telefone, telefoneAlternativo } = req.body;

    if (!name || !birth || !nacionalidade || !documentos || !docNumber || !Distrito || !Bairro || !houseNumber || !telefone) {
        return res.status(400).json({ success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    try {
        // Firestore irá criar a coleção 'cadastro_dls' automaticamente se ela não existir
        // Quando você adiciona o primeiro documento na coleção, ela é criada automaticamente
        await db.collection('cadastro_dls').add({
            name,
            birth,
            nacionalidade,
            civilState,
            documentos,
            docNumber,
            Distrito,
            Bairro,
            houseNumber,
            quarterNumber,
            telefone,
            telefoneAlternativo
        });

        res.json({ success: true, message: 'Dados salvos com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar dados no Firestore:', error);
        res.status(500).json({ success: false, message: 'Erro ao salvar dados no Firestore.' });
    }
});

app.get('/api/usuarios_cadastrados', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'usuarios.html'))
})

app.post('/api/usuarios_cadastrados', (req, res) => {

})

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`SERVIDOR RODANDO NA PORTA ${PORT}`);
});
