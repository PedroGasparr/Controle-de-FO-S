// Funções para manipulação da interface do usuário

// Adiciona um novo campo de material
function addMaterialField(container, materialData = { ni: '', falta: 0, sobra: 0, avaria: 0 }) {
    const materialId = Date.now(); // ID único para o material
    
    const materialHtml = `
        <div class="material-item" data-id="${materialId}">
            <button type="button" class="remove-material" title="Remover material">
                <i class="fas fa-times"></i>
            </button>
            <div class="form-row">
                <div class="form-group">
                    <label for="ni-${materialId}">NI</label>
                    <input type="text" id="ni-${materialId}" value="${materialData.ni || ''}" placeholder="Número de Identificação" required>
                </div>
                <div class="form-group">
                    <label for="falta-${materialId}">Falta (fardos)</label>
                    <input type="number" id="falta-${materialId}" value="${materialData.falta || 0}" min="0" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="sobra-${materialId}">Sobra (fardos)</label>
                    <input type="number" id="sobra-${materialId}" value="${materialData.sobra || 0}" min="0" required>
                </div>
                <div class="form-group">
                    <label for="avaria-${materialId}">Avaria (fardos)</label>
                    <input type="number" id="avaria-${materialId}" value="${materialData.avaria || 0}" min="0" required>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', materialHtml);
    
    // Adiciona evento para remover o material
    const materialElement = container.querySelector(`.material-item[data-id="${materialId}"]`);
    const removeBtn = materialElement.querySelector('.remove-material');
    
    removeBtn.addEventListener('click', () => {
        materialElement.remove();
    });
    
    return materialId;
}

// Coleta os dados dos materiais
function getMaterialsData(container) {
    const materials = [];
    const materialElements = container.querySelectorAll('.material-item');
    
    materialElements.forEach(materialEl => {
        const materialId = materialEl.dataset.id;
        
        materials.push({
            ni: document.getElementById(`ni-${materialId}`).value,
            falta: parseInt(document.getElementById(`falta-${materialId}`).value) || 0,
            sobra: parseInt(document.getElementById(`sobra-${materialId}`).value) || 0,
            avaria: parseInt(document.getElementById(`avaria-${materialId}`).value) || 0
        });
    });
    
    return materials;
}

// Exibe um card de FO
// Exibe um card de FO
function createFOCard(fo) {
    // Formata a data
    const createdAt = new Date(fo.createdAt);
    const dateStr = createdAt.toLocaleDateString('pt-BR');
    
    // Define a cor do status
    let statusClass = '';
    let statusText = '';
    
    switch (fo.status) {
        case 'recebido':
            statusClass = 'status-recebido';
            statusText = 'Recebido';
            break;
        case 'aguardando':
            statusClass = 'status-aguardando';
            statusText = 'Aguardando';
            break;
        case 'devolvido':
            statusClass = 'status-devolvido';
            statusText = 'Devolvido';
            break;
        default:
            statusClass = 'status-aguardando';
            statusText = 'Aguardando';
    }
    
    return `
        <div class="fo-card" data-id="${fo.id}">
            <div class="fo-card-header">
                <h3 class="fo-card-title">FO #${fo.numeroFo}</h3>
                <span class="fo-card-status ${statusClass}">${statusText}</span>
            </div>
            <div class="fo-card-body">
                <div class="fo-card-detail">
                    <span class="fo-card-detail-label">Tipo:</span>
                    <span class="fo-card-detail-value">${fo.tipo === 'devolucao_total' ? 'Devolução Total' : 'Devolução Parcial'}</span>
                </div>
                <div class="fo-card-detail">
                    <span class="fo-card-detail-label">Data:</span>
                    <span class="fo-card-detail-value">${dateStr}</span>
                </div>
                <div class="fo-card-motive">
                    <div class="fo-card-detail">
                        <span class="fo-card-detail-label">Motivo:</span>
                        <span class="fo-card-detail-value">${fo.motivo.substring(0, 50)}${fo.motivo.length > 50 ? '...' : ''}</span>
                    </div>
                </div>
            </div>
            <div class="fo-card-footer">
                <button class="fo-card-btn btn-secondary view-fo-btn" data-id="${fo.id}">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="fo-card-btn btn-primary edit-fo-btn" data-id="${fo.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        </div>
    `;
}

// Exibe os detalhes de uma FO em um modal
function showFODetails(fo, isEditable = false) {
    // Formata as datas
    const createdAt = new Date(fo.createdAt);
    const dataCriacao = new Date(fo.dataCriacao);
    const dataChegada = new Date(fo.dataChegada);
    const dataMovimento = fo.dataMovimento ? new Date(fo.dataMovimento) : null;
    
    // Formata os materiais
    let materiaisHtml = '';
    if (fo.materiais && fo.materiais.length > 0) {
        materiaisHtml = `
            <h3>Materiais</h3>
            <table>
                <thead>
                    <tr>
                        <th>NI</th>
                        <th>Falta</th>
                        <th>Sobra</th>
                        <th>Avaria</th>
                    </tr>
                </thead>
                <tbody>
                    ${fo.materiais.map(material => `
                        <tr>
                            <td>${material.ni}</td>
                            <td>${material.falta} fardos</td>
                            <td>${material.sobra} fardos</td>
                            <td>${material.avaria} fardos</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    // Cria o conteúdo do modal
    const modalContent = `
        <div class="form-section">
            <h3>Informações Básicas</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Tipo de FO</label>
                    ${isEditable ? `
                        <select id="modalTipo" required>
                            <option value="devolucao_total" ${fo.tipo === 'devolucao_total' ? 'selected' : ''}>Devolução Total</option>
                            <option value="devolucao_parcial" ${fo.tipo === 'devolucao_parcial' ? 'selected' : ''}>Devolução Parcial</option>
                        </select>
                    ` : `<p>${fo.tipo === 'devolucao_total' ? 'Devolução Total' : 'Devolução Parcial'}</p>`}
                </div>
                <div class="form-group">
                    <label>Nº FO</label>
                    ${isEditable ? `
                        <input type="text" id="modalNumeroFo" value="${fo.numeroFo || ''}" required>
                    ` : `<p>${fo.numeroFo || '--'}</p>`}
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Data Criação da FO</label>
                    ${isEditable ? `
                        <input type="date" id="modalDataCriacao" value="${fo.dataCriacao || ''}" required>
                    ` : `<p>${dataCriacao.toLocaleDateString('pt-BR') || '--'}</p>`}
                </div>
                <div class="form-group">
                    <label>Data de Chegada ao CD</label>
                    ${isEditable ? `
                        <input type="date" id="modalDataChegada" value="${fo.dataChegada || ''}" required>
                    ` : `<p>${dataChegada.toLocaleDateString('pt-BR') || '--'}</p>`}
                </div>
            </div>
            
            <div class="form-group">
                <label>Motivo da FO</label>
                ${isEditable ? `
                    <textarea id="modalMotivo" rows="3" required>${fo.motivo || ''}</textarea>
                ` : `<p>${fo.motivo || '--'}</p>`}
            </div>
            
            <div class="form-group">
                <label>Observações</label>
                ${isEditable ? `
                    <textarea id="modalObservacoes" rows="2">${fo.observacoes || ''}</textarea>
                ` : `<p>${fo.observacoes || '--'}</p>`}
            </div>
        </div>
        
        <div class="form-section">
            <h3>Quantidades</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Quantidade de Fardos Faturada</label>
                    ${isEditable ? `
                        <input type="number" id="modalQtdFardosFaturada" value="${fo.qtdFardosFaturada || 0}" min="0" required>
                    ` : `<p>${fo.qtdFardosFaturada || 0}</p>`}
                </div>
                <div class="form-group">
                    <label>Quantidade de Fardos FO</label>
                    ${isEditable ? `
                        <input type="number" id="modalQtdFardosFo" value="${fo.qtdFardosFo || 0}" min="0" required>
                    ` : `<p>${fo.qtdFardosFo || 0}</p>`}
                </div>
                <div class="form-group">
                    <label>Quantidade recebida Fisicamente</label>
                    ${isEditable ? `
                        <input type="number" id="modalQtdRecebida" value="${fo.qtdRecebida || 0}" min="0" required>
                    ` : `<p>${fo.qtdRecebida || 0}</p>`}
                </div>
            </div>
        </div>
        
        ${materiaisHtml}
        
        <div class="form-section">
            <h3>Status</h3>
            <div class="form-row">
                <div class="form-group">
                    <label>Material está segregado?</label>
                    ${isEditable ? `
                        <div class="radio-group">
                            <label><input type="radio" name="modalSegregado" value="sim" ${fo.segregado === 'sim' ? 'checked' : ''} required> Sim</label>
                            <label><input type="radio" name="modalSegregado" value="nao" ${fo.segregado === 'nao' ? 'checked' : ''}> Não</label>
                        </div>
                    ` : `<p>${fo.segregado === 'sim' ? 'Sim' : 'Não'}</p>`}
                </div>
                
                <div class="form-group" id="modalDepositoGroup" ${fo.segregado === 'sim' && fo.deposito ? '' : 'style="display: none;"'}>
                    <label>Material foi lançado em depósito?</label>
                    ${isEditable ? `
                        <select id="modalDeposito">
                            <option value="">Selecione o depósito...</option>
                            <option value="deposito_a" ${fo.deposito === 'deposito_a' ? 'selected' : ''}>Depósito A</option>
                            <option value="deposito_b" ${fo.deposito === 'deposito_b' ? 'selected' : ''}>Depósito B</option>
                            <option value="deposito_c" ${fo.deposito === 'deposito_c' ? 'selected' : ''}>Depósito C</option>
                        </select>
                    ` : `<p>${fo.deposito ? fo.deposito.replace('_', ' ').toUpperCase() : '--'}</p>`}
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Data do movimento do estoque</label>
                    ${isEditable ? `
                        <input type="date" id="modalDataMovimento" value="${fo.dataMovimento || ''}">
                    ` : `<p>${dataMovimento ? dataMovimento.toLocaleDateString('pt-BR') : '--'}</p>`}
                </div>
                <div class="form-group">
                    <label>Usuário</label>
                    <p>${fo.usuario || firebase.auth().currentUser.email}</p>
                </div>
            </div>
            
            <div class="form-group">
                <label>Status</label>
                ${isEditable ? `
                    <select id="modalStatus">
                        <option value="recebido" ${fo.status === 'recebido' ? 'selected' : ''}>Recebido</option>
                        <option value="aguardando" ${fo.status === 'aguardando' ? 'selected' : ''}>Aguardando regularização</option>
                        <option value="devolvido" ${fo.status === 'devolvido' ? 'selected' : ''}>Devolvido ao Estoque</option>
                    </select>
                ` : `<p>${getStatusText(fo.status)}</p>`}
            </div>
        </div>
    `;
    
    return modalContent;
}

// Obtém o texto do status
function getStatusText(status) {
    switch (status) {
        case 'recebido': return 'Recebido';
        case 'aguardando': return 'Aguardando regularização';
        case 'devolvido': return 'Devolvido ao Estoque';
        default: return status;
    }
}

// Mostra mensagem para o usuário
function showMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = isError ? 'message error' : 'message success';
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}