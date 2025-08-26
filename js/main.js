document.addEventListener('DOMContentLoaded', () => {
    // Tela de Dashboard (Registro de FO)
    if (document.getElementById('foForm')) {
        const foForm = document.getElementById('foForm');
        const materiaisContainer = document.getElementById('materiaisContainer');
        const addMaterialBtn = document.getElementById('addMaterialBtn');
        const segregadoRadios = document.querySelectorAll('input[name="segregado"]');
        const depositoGroup = document.getElementById('depositoGroup');
        
        // Adiciona um material inicial
        addMaterialField(materiaisContainer);
        
        // Evento para adicionar mais materiais
        addMaterialBtn.addEventListener('click', () => {
            addMaterialField(materiaisContainer);
        });
        
        // Mostra/oculta campo de depósito baseado na segregação
        segregadoRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                depositoGroup.style.display = e.target.value === 'sim' ? 'block' : 'none';
                if (e.target.value !== 'sim') {
                    document.getElementById('deposito').value = '';
                }
            });
        });
        
        // Submit do formulário de FO
        foForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Coleta os dados do formulário
            const foData = {
                tipo: document.getElementById('tipo').value,
                motivo: document.getElementById('motivo').value,
                numeroFo: document.getElementById('numeroFo').value,
                dataCriacao: document.getElementById('dataCriacao').value,
                dataChegada: document.getElementById('dataChegada').value,
                observacoes: document.getElementById('observacoes').value,
                qtdFardosFaturada: parseInt(document.getElementById('qtdFardosFaturada').value) || 0,
                qtdFardosFo: parseInt(document.getElementById('qtdFardosFo').value) || 0,
                qtdRecebida: parseInt(document.getElementById('qtdRecebida').value) || 0,
                materiais: getMaterialsData(materiaisContainer),
                segregado: document.querySelector('input[name="segregado"]:checked').value,
                deposito: document.getElementById('deposito').value,
                dataMovimento: document.getElementById('dataMovimento').value,
                usuario: document.getElementById('usuario').value
            };
            
            // Salva no Firebase
            saveFO(foData)
                .then((foId) => {
                    showMessage('loginMessage', 'FO salva com sucesso!', false);
                    window.location.href = `registros.html?foId=${foId}`;
                })
                .catch((error) => {
                    showMessage('loginMessage', `Erro ao salvar FO: ${error.message}`, true);
                });
        });
        
        // Botão de cancelar
        if (document.getElementById('cancelBtn')) {
            document.getElementById('cancelBtn').addEventListener('click', () => {
                if (confirm('Deseja realmente cancelar? Todos os dados não salvos serão perdidos.')) {
                    window.location.href = 'registros.html';
                }
            });
        }
    }
    
    // Tela de Registros
    if (document.getElementById('registrosContainer')) {
        const registrosContainer = document.getElementById('registrosContainer');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        
        // Carrega os registros
        function loadRegistros(filters = {}) {
            registrosContainer.innerHTML = '<p>Carregando registros...</p>';
            
            getFOs(filters)
                .then((fos) => {
                    if (fos.length === 0) {
                        registrosContainer.innerHTML = '<p>Nenhum registro encontrado.</p>';
                        return;
                    }
                    
                    registrosContainer.innerHTML = '';
                    fos.forEach(fo => {
                        registrosContainer.insertAdjacentHTML('beforeend', createFOCard(fo));
                    });
                    
                    // Adiciona eventos aos botões
                    document.querySelectorAll('.view-fo-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const foId = e.target.dataset.id || e.target.closest('button').dataset.id;
                            openFOModal(foId, false);
                        });
                    });
                    
                    document.querySelectorAll('.edit-fo-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const foId = e.target.dataset.id || e.target.closest('button').dataset.id;
                            openFOModal(foId, true);
                        });
                    });
                })
                .catch((error) => {
                    registrosContainer.innerHTML = `<p class="error">Erro ao carregar registros: ${error.message}</p>`;
                });
        }
        
        // Abre o modal de FO
        function openFOModal(foId, isEditable) {
            const modal = document.getElementById('foModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalContent = document.getElementById('modalContent');
            const saveModalBtn = document.getElementById('saveModalBtn');
            const changeStatusBtn = document.getElementById('changeStatusBtn');
            
            modalTitle.textContent = isEditable ? 'Editar FO' : 'Detalhes da FO';
            saveModalBtn.style.display = isEditable ? 'block' : 'none';
            
            // Carrega os dados da FO
            getFOById(foId)
                .then((fo) => {
                    modalContent.innerHTML = showFODetails(fo, isEditable);
                    modal.style.display = 'block';
                    
                    // Configura o botão de salvar
                    if (isEditable) {
                        saveModalBtn.onclick = () => {
                            const updatedData = {
                                tipo: document.getElementById('modalTipo').value,
                                numeroFo: document.getElementById('modalNumeroFo').value,
                                dataCriacao: document.getElementById('modalDataCriacao').value,
                                dataChegada: document.getElementById('modalDataChegada').value,
                                motivo: document.getElementById('modalMotivo').value,
                                observacoes: document.getElementById('modalObservacoes').value,
                                qtdFardosFaturada: parseInt(document.getElementById('modalQtdFardosFaturada').value) || 0,
                                qtdFardosFo: parseInt(document.getElementById('modalQtdFardosFo').value) || 0,
                                qtdRecebida: parseInt(document.getElementById('modalQtdRecebida').value) || 0,
                                segregado: document.querySelector('input[name="modalSegregado"]:checked').value,
                                deposito: document.getElementById('modalDeposito').value,
                                dataMovimento: document.getElementById('modalDataMovimento').value,
                                status: document.getElementById('modalStatus').value
                            };
                            
                            updateFO(foId, updatedData)
                                .then(() => {
                                    modal.style.display = 'none';
                                    loadRegistros({ status: statusFilter.value });
                                })
                                .catch((error) => {
                                    alert(`Erro ao atualizar FO: ${error.message}`);
                                });
                        };
                    }
                    
                    // Configura o botão de alterar status
                    changeStatusBtn.onclick = () => {
                        const currentStatus = fo.status;
                        let newStatus;
                        
                        if (currentStatus === 'recebido') {
                            newStatus = 'aguardando';
                        } else if (currentStatus === 'aguardando') {
                            newStatus = 'devolvido';
                        } else {
                            newStatus = 'recebido';
                        }
                        
                        if (confirm(`Deseja alterar o status para "${getStatusText(newStatus)}"?`)) {
                            updateFOStatus(foId, newStatus)
                                .then(() => {
                                    modal.style.display = 'none';
                                    loadRegistros({ status: statusFilter.value });
                                })
                                .catch((error) => {
                                    alert(`Erro ao alterar status: ${error.message}`);
                                });
                        }
                    };
                })
                .catch((error) => {
                    alert(`Erro ao carregar FO: ${error.message}`);
                });
        }
        
        // Filtros
        statusFilter.addEventListener('change', () => {
            const filters = {};
            if (statusFilter.value !== 'todos') {
                filters.status = statusFilter.value;
            }
            loadRegistros(filters);
        });
        
        dateFilter.addEventListener('change', () => {
            // Implementar filtro por data se necessário
        });
        
        // Fecha o modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('foModal').style.display = 'none';
            });
        });
        
        // Carrega os registros inicialmente
        loadRegistros();
        
        // Verifica se há um FO ID na URL (após criação)
        const urlParams = new URLSearchParams(window.location.search);
        const foId = urlParams.get('foId');
        
        if (foId) {
            openFOModal(foId, false);
        }
    }
    
    // Tela de Histórico
    if (document.getElementById('historicoContainer')) {
        const historicoContainer = document.getElementById('historicoContainer');
        const historicoStatusFilter = document.getElementById('historicoStatusFilter');
        const dataInicioFilter = document.getElementById('dataInicio');
        const dataFimFilter = document.getElementById('dataFim');
        const filterHistoricoBtn = document.getElementById('filterHistoricoBtn');
        
        // Carrega o histórico
        function loadHistorico(filters = {}) {
            historicoContainer.innerHTML = '<p>Carregando histórico...</p>';
            
            getFinishedFOs(filters)
                .then((fos) => {
                    if (fos.length === 0) {
                        historicoContainer.innerHTML = '<p>Nenhum registro no histórico.</p>';
                        return;
                    }
                    
                    historicoContainer.innerHTML = '';
                    fos.forEach(fo => {
                        historicoContainer.insertAdjacentHTML('beforeend', createFOCard(fo));
                    });
                    
                    // Adiciona eventos aos botões de visualização
                    document.querySelectorAll('.view-fo-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const foId = e.target.dataset.id || e.target.closest('button').dataset.id;
                            openHistoricoModal(foId);
                        });
                    });
                    
                    // Remove botões de edição no histórico
                    document.querySelectorAll('.edit-fo-btn').forEach(btn => {
                        btn.style.display = 'none';
                    });
                })
                .catch((error) => {
                    historicoContainer.innerHTML = `<p class="error">Erro ao carregar histórico: ${error.message}</p>`;
                });
        }
        
        // Abre o modal de histórico
        function openHistoricoModal(foId) {
            const modal = document.getElementById('historicoModal');
            const modalContent = document.getElementById('historicoModalContent');
            
            // Carrega os dados da FO
            getFOById(foId)
                .then((fo) => {
                    modalContent.innerHTML = showFODetails(fo, false);
                    modal.style.display = 'block';
                })
                .catch((error) => {
                    alert(`Erro ao carregar FO: ${error.message}`);
                });
        }
        
        // Filtra o histórico
        filterHistoricoBtn.addEventListener('click', () => {
            const filters = {};
            
            if (historicoStatusFilter.value !== 'todos') {
                filters.status = historicoStatusFilter.value;
            }
            
            if (dataInicioFilter.value && dataFimFilter.value) {
                filters.startDate = dataInicioFilter.value;
                filters.endDate = dataFimFilter.value;
            }
            
            loadHistorico(filters);
        });
        
        // Fecha o modal
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('historicoModal').style.display = 'none';
            });
        });
        
        // Carrega o histórico inicialmente
        loadHistorico();
    }
});