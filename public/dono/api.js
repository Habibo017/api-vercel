const express = require('express');

const dono = './dono.json'

const name = dono?.config.nome || "fdpt"
const idade = dono.config?.idade || "fdpt"

const app = express()
app.get('/api/names', (req, res) => {
    const resposta = {
        MYname: name,
        idade: idade
    }

    res.json(resposta)
       
       
})


app.listen(3000, () => {
    console.log('servidor ativo bro')
})