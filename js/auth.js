// Inicializa o Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDKY8xXjNwK2-QD3_A12f6hNCDOxfVt2wk",
    authDomain: "noticias-gzl.firebaseapp.com",
    databaseURL: "https://noticias-gzl-default-rtdb.firebaseio.com",
    projectId: "noticias-gzl",
    storageBucket: "noticias-gzl.appspot.com",
    messagingSenderId: "10073993896",
    appId: "1:10073993896:web:a4eb1e27cc4a1753a4889d",
    measurementId: "G-2GTG7VPN44"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Provedor de autenticação do Google
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Verifica o estado de autenticação
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário logado
        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
            window.location.href = 'dashboard.html';
        }
        
        // Define o nome do usuário no formulário
        if (document.getElementById('usuario')) {
            document.getElementById('usuario').value = user.email;
        }
        
        // Verifica se é um novo usuário e salva no banco de dados
        if (user.metadata.creationTime === user.metadata.lastSignInTime) {
            saveUserData(user);
        }
    } else {
        // Usuário não logado, redireciona para login
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});

// Função para salvar dados do usuário no banco de dados
function saveUserData(user) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        providerData: user.providerData.map(provider => ({
            providerId: provider.providerId,
            uid: provider.uid,
            displayName: provider.displayName,
            email: provider.email,
            photoURL: provider.photoURL
        })),
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        lastLoginAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    return database.ref(`users/${user.uid}`).set(userData);
}

// Função de login com e-mail e senha
function login(email, password, rememberMe = false) {
    const persistence = rememberMe ? 
        firebase.auth.Auth.Persistence.LOCAL : 
        firebase.auth.Auth.Persistence.SESSION;
    
    return auth.setPersistence(persistence)
        .then(() => {
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then((userCredential) => {
            return userCredential.user;
        })
        .catch((error) => {
            throw error;
        });
}

// Função de login com Google
function loginWithGoogle() {
    return auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            return auth.signInWithPopup(googleProvider);
        })
        .then((result) => {
            return result.user;
        })
        .catch((error) => {
            throw error;
        });
}

// Função de registro com e-mail e senha
function register(email, password, name) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Atualiza o nome do usuário
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                return userCredential.user;
            });
        })
        .then((user) => {
            // Salva dados adicionais do usuário no banco de dados
            return saveUserData(user).then(() => user);
        })
        .catch((error) => {
            throw error;
        });
}

// Função de logout
function logout() {
    return auth.signOut();
}

// Função para redefinir senha
function resetPassword(email) {
    return auth.sendPasswordResetEmail(email)
        .then(() => {
            return true;
        })
        .catch((error) => {
            throw error;
        });
}

// Event listeners para botões de logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutButtons = document.querySelectorAll('#logoutBtn');
    
    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', () => {
                logout().then(() => {
                    window.location.href = 'index.html';
                });
            });
        }
    });
    
    // Botão para nova FO
    if (document.getElementById('newFoBtn')) {
        document.getElementById('newFoBtn').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }
    
    // Botão para voltar aos registros
    if (document.getElementById('backToRegistros')) {
        document.getElementById('backToRegistros').addEventListener('click', () => {
            window.location.href = 'registros.html';
        });
    }
    
    // Submit do formulário de login
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            const messageElement = document.getElementById('loginMessage');
            
            messageElement.classList.add('hidden');
            
            login(email, password, rememberMe)
                .then(() => {
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    messageElement.textContent = getFirebaseErrorMessage(error);
                    messageElement.className = 'message error';
                    messageElement.classList.remove('hidden');
                });
        });
    }
    
    // Botão de login com Google
    if (document.getElementById('googleLoginBtn')) {
        document.getElementById('googleLoginBtn').addEventListener('click', () => {
            const messageElement = document.getElementById('loginMessage');
            messageElement.classList.add('hidden');
            
            loginWithGoogle()
                .then(() => {
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    messageElement.textContent = getFirebaseErrorMessage(error);
                    messageElement.className = 'message error';
                    messageElement.classList.remove('hidden');
                });
        });
    }
    
    // Link para registro
    if (document.getElementById('registerLink')) {
        document.getElementById('registerLink').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registerModal').classList.remove('hidden');
        });
    }
    
    // Fechar modal de registro
    if (document.querySelector('.close-modal')) {
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('registerModal').classList.add('hidden');
        });
    }
    
    // Submit do formulário de registro
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const messageElement = document.getElementById('loginMessage');
            
            if (password !== confirmPassword) {
                messageElement.textContent = 'As senhas não coincidem.';
                messageElement.className = 'message error';
                messageElement.classList.remove('hidden');
                return;
            }
            
            register(email, password, name)
                .then(() => {
                    messageElement.textContent = 'Conta criada com sucesso! Redirecionando...';
                    messageElement.className = 'message success';
                    messageElement.classList.remove('hidden');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                })
                .catch((error) => {
                    messageElement.textContent = getFirebaseErrorMessage(error);
                    messageElement.className = 'message error';
                    messageElement.classList.remove('hidden');
                });
        });
    }
    
    // Toggle de visibilidade da senha
    if (document.querySelector('.toggle-password')) {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }
    
    // Validação de força da senha
    if (document.getElementById('regPassword')) {
        document.getElementById('regPassword').addEventListener('input', function() {
            const strengthBar = document.querySelector('.strength-bar');
            const strengthText = document.querySelector('.strength-text span');
            const password = this.value;
            let strength = 0;
            
            // Verifica o comprimento
            if (password.length > 0) strength += 1;
            if (password.length >= 8) strength += 1;
            
            // Verifica caracteres diversos
            if (/[A-Z]/.test(password)) strength += 1;
            if (/[0-9]/.test(password)) strength += 1;
            if (/[^A-Za-z0-9]/.test(password)) strength += 1;
            
            // Atualiza a barra e o texto
            const width = (strength / 5) * 100;
            strengthBar.style.width = `${width}%`;
            
            switch(strength) {
                case 0:
                    strengthBar.style.backgroundColor = 'transparent';
                    strengthText.textContent = '';
                    break;
                case 1:
                case 2:
                    strengthBar.style.backgroundColor = 'var(--danger-color)';
                    strengthText.textContent = 'fraca';
                    break;
                case 3:
                    strengthBar.style.backgroundColor = 'var(--warning-color)';
                    strengthText.textContent = 'média';
                    break;
                case 4:
                case 5:
                    strengthBar.style.backgroundColor = 'var(--success-color)';
                    strengthText.textContent = 'forte';
                    break;
            }
        });
    }
});

// Função para traduzir mensagens de erro do Firebase
function getFirebaseErrorMessage(error) {
    switch(error.code) {
        case 'auth/invalid-email':
            return 'E-mail inválido. Por favor, verifique o e-mail digitado.';
        case 'auth/user-disabled':
            return 'Esta conta foi desativada. Entre em contato com o suporte.';
        case 'auth/user-not-found':
            return 'Nenhuma conta encontrada com este e-mail.';
        case 'auth/wrong-password':
            return 'Senha incorreta. Tente novamente ou redefina sua senha.';
        case 'auth/email-already-in-use':
            return 'Este e-mail já está em uso por outra conta.';
        case 'auth/operation-not-allowed':
            return 'Operação não permitida. Entre em contato com o suporte.';
        case 'auth/weak-password':
            return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
        case 'auth/account-exists-with-different-credential':
            return 'Uma conta já existe com o mesmo endereço de e-mail, mas credenciais diferentes.';
        case 'auth/popup-closed-by-user':
            return 'A janela de login foi fechada antes de concluir a autenticação.';
        case 'auth/cancelled-popup-request':
        case 'auth/popup-blocked':
            return 'A janela de login foi bloqueada. Por favor, permita pop-ups para este site.';
        default:
            return 'Ocorreu um erro durante a autenticação. Por favor, tente novamente.';
    }
}