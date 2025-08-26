// Funções para manipulação do banco de dados Firebase

// Salva uma nova FO no banco de dados
function saveFO(foData) {
    const userId = firebase.auth().currentUser.uid;
    const newFoRef = database.ref('fos').push();
    
    // Adiciona metadados
    foData.createdAt = firebase.database.ServerValue.TIMESTAMP;
    foData.updatedAt = firebase.database.ServerValue.TIMESTAMP;
    foData.userId = userId;
    foData.status = 'recebido'; // Status padrão
    
    return newFoRef.set(foData)
        .then(() => {
            return newFoRef.key; // Retorna o ID da FO
        });
}

// Atualiza uma FO existente
function updateFO(foId, updatedData) {
    updatedData.updatedAt = firebase.database.ServerValue.TIMESTAMP;
    return database.ref(`fos/${foId}`).update(updatedData);
}

// Obtém todas as FOs (com filtros opcionais)
function getFOs(filters = {}) {
    let query = database.ref('fos').orderByChild('createdAt');
    
    // Aplica filtros
    if (filters.status && filters.status !== 'todos') {
        query = query.orderByChild('status').equalTo(filters.status);
    }
    
    return query.once('value')
        .then((snapshot) => {
            const fos = [];
            snapshot.forEach((childSnapshot) => {
                const fo = childSnapshot.val();
                fo.id = childSnapshot.key;
                fos.push(fo);
            });
            
            // Ordena do mais recente para o mais antigo
            return fos.sort((a, b) => b.createdAt - a.createdAt);
        });
}

// Obtém FOs finalizadas (para histórico)
function getFinishedFOs(filters = {}) {
    let query = database.ref('fos').orderByChild('createdAt');
    
    // Filtra apenas por status finalizados
    const statusFilters = ['recebido', 'devolvido'];
    
    return query.once('value')
        .then((snapshot) => {
            const fos = [];
            snapshot.forEach((childSnapshot) => {
                const fo = childSnapshot.val();
                if (statusFilters.includes(fo.status)) {
                    // Aplica filtros adicionais
                    if (filters.startDate && filters.endDate) {
                        const foDate = new Date(fo.createdAt);
                        const startDate = new Date(filters.startDate);
                        const endDate = new Date(filters.endDate);
                        
                        if (foDate >= startDate && foDate <= endDate) {
                            fo.id = childSnapshot.key;
                            fos.push(fo);
                        }
                    } else {
                        fo.id = childSnapshot.key;
                        fos.push(fo);
                    }
                }
            });
            
            return fos.sort((a, b) => b.createdAt - a.createdAt);
        });
}

// Obtém uma FO específica por ID
function getFOById(foId) {
    return database.ref(`fos/${foId}`).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const fo = snapshot.val();
                fo.id = snapshot.key;
                return fo;
            }
            return null;
        });
}

// Atualiza o status de uma FO
function updateFOStatus(foId, newStatus) {
    const updates = {
        status: newStatus,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    return database.ref(`fos/${foId}`).update(updates);
}