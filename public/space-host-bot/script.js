// script.js

// Botão para iniciar o bot
document.getElementById('start-bot').addEventListener('click', function() {
    const statusText = document.querySelector('.status-text');
    statusText.textContent = 'online';
    statusText.style.color = 'green';
    alert('Bot iniciado!');
});

// Botão para atualizar os logs
document.getElementById('update-logs').addEventListener('click', function() {
    const logOutput = document.getElementById('log-output');
    logOutput.innerHTML = '<p>Bot conectado ao servidor com sucesso!</p>';
});

// Botão para limpar os logs
document.getElementById('clear-logs').addEventListener('click', function() {
    const logOutput = document.getElementById('log-output');
    logOutput.innerHTML = '<p>Nenhum log disponível.</p>';
});

// Botão para baixar os logs
document.getElementById('download-logs').addEventListener('click', function() {
    alert('Logs baixados!');
});
