import axios from 'axios';

const apiKey = 'f9f4kaik324r8w2ls0lpwe';  // Substitua com a chave de API gerada
const query = 'Ola quanto custa o curso de frances regular?';

axios.post('http://localhost:2052/api/tina/messages', 
    { 
        query 
    },
    {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey  // Inclua a chave de API no cabeçalho
        }
    }
)
.then(response => {
    console.log('Resposta da API:', response.data.answer);
})
.catch(error => {
    console.error('Erro ao fazer requisição:', error.response ? error.response.data : error.message);
});
