// Evento de envio do formulário
document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Impede envio automático do formulário

    if (validarLogin()) {
        const cargo = document.getElementById("cargo").value;
        const matricula = document.getElementById("matricula").value;
        const senha = document.getElementById("senha").value;

        try {
            const resposta = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  matricula: matricula,
                  senha: senha
                })
            });

            if (resposta.ok) {
                const dados = await resposta.json();
                localStorage.setItem('token', dados.accessToken); // Corrigido aqui

                window.location.href = "list-case.html"; // Redireciona após login
            } else {
                const erro = await resposta.json();
                mostrarErro(erro.msg || "Falha no login. Verifique suas credenciais."); // Corrigido aqui
            }
        } catch (erro) {
            mostrarErro("Erro de conexão com o servidor.");
        }

    }
});

// Validação dos campos
function validarLogin() {
    const cargo = document.getElementById("cargo").value;
    const matricula = document.getElementById("matricula").value;
    const senha = document.getElementById("senha").value;

    if (cargo === '') {
        mostrarErro("Por favor, selecione seu cargo na lista");
        return false;
    }

    if (matricula.trim() === '') {
        mostrarErro("Digite sua matrícula para continuar");
        return false;
    }

    if (senha.trim() === '') {
        mostrarErro("Digite sua senha");
        return false;
    }

    return true;
}

// Exibe mensagens de erro
function mostrarErro(mensagem) {
    const erro = document.getElementById("mensagemErro");
    erro.textContent = mensagem;
    erro.style.color = "red";
    erro.style.display = "block";
}

// Registro do Service Worker (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration);
            })
            .catch(error => {
                console.log('Falha ao registrar o Service Worker:', error);
            });
    });
}
