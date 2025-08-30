// VARIÁVEIS GLOBAIS
let records = [];
let drivers = ['Wagner', 'Fabrício Junho', 'Luciane', 'Tiago', 'Apolo', 'Anselmo Soares', 'Felipe Ramos', 'Fábio Sousa', 'Marllon Y', 'Renato Salustiano', 'Jefferson cruz', 'ISAAC', 'Fábio Imbá', 'Renato Mattos', 'Juan Cavalcante', 'Felipe Quaresma', 'Emanoel', 'Tais', 'Jonathan vilar', 'William Rastelli', 'Mônica', 'Pablo Henrique', 'Douglas', 'Izael', 'Fabio silva', 'Fabiola', 'Francisco A', 'Lorran', 'Jonh Jonh', 'Marcos F', 'Matheus M', 'Ludimila', 'José', 'Felipe.A', 'ROGER P', 'MATEUS', 'Jhonatan', 'renan M', 'Leandro de Jesus', 'Pablo F', 'Daniel', 'ruth', 'Romarioooooo'];
let editIndex = -1; // Usado para saber se está editando ou adicionando um novo registro

// DADOS DE REFERÊNCIA PARA DATAS E HORÁRIOS
const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// FUNÇÕES DE FORMATAÇÃO E UTILITÁRIAS
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const dayOfWeek = dayNames[date.getDay()];
    return `${day} ${month}<br>(${dayOfWeek})`;
}

function formatFullDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function populateDriverDatalist() {
    const driverList = document.getElementById('driver-list');
    driverList.innerHTML = '';
    const uniqueDrivers = [...new Set(drivers)].sort();
    uniqueDrivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver;
        driverList.appendChild(option);
    });
}

function calculateTotalByDate(selectedDate) {
    if (!selectedDate) {
        const total = records.reduce((sum, record) => sum + Number(record.quantity), 0);
        document.getElementById('totalPackagesCount').textContent = total;
        return;
    }
    const total = records.filter(record => record.record_date === selectedDate).reduce((sum, record) => sum + Number(record.quantity), 0);
    document.getElementById('totalPackagesCount').textContent = total;
}

// FUNÇÕES DE INTERAÇÃO COM O BACKEND (NETLIFY FUNCTIONS)
async function loadRecords() {
    try {
        const response = await fetch('/.netlify/functions/get-records');
        const data = await response.json();
        
        if (response.ok) {
            records = data; // Atualiza a variável global com os dados do banco
            const tableBody = document.getElementById('tableBody');
            tableBody.innerHTML = '';
            
            records.forEach((record, index) => {
                const row = document.createElement('tr');
                row.classList.add('record-row');
                row.onclick = () => showRouteDetails(record.record_date, record.route);
                row.innerHTML = `
                    <td>${formatDate(record.record_date)}</td>
                    <td>${record.route || record.initials || ''}</td>
                    <td>${record.driver}</td>
                    <td><b>${record.quantity}</b></td>
                    <td class="actions">
                        <button class="add-btn" onclick="event.stopPropagation(); addQuantity(${record.id});">+</button>
                        <button class="edit-btn" onclick="event.stopPropagation(); editRecord(${record.id});">E</button>
                        <button class="delete-btn" onclick="event.stopPropagation(); deleteRecord(${record.id});">-</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            calculateTotalByDate(document.getElementById('total-date-filter').value);
            populateDriverDatalist();
        } else {
            alert('Erro ao carregar os registros.');
            console.error('Erro na requisição:', data);
        }
    } catch (error) {
        alert('Erro ao se comunicar com o servidor.');
        console.error('Erro na requisição:', error);
    }
}

async function addOrUpdateRecord() {
    const date = document.getElementById('date-pacotes').value;
    const quantity = document.getElementById('quantity-pacotes').value;
    const route = document.getElementById('route-pacotes').value;
    const driver = document.getElementById('driver-pacotes').value;

    if (!date || !quantity || !route || !driver) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    const record = { date, quantity: Number(quantity), route, driver };

    let url;
    let method;

    if (editIndex !== -1) {
        url = '/.netlify/functions/update-record';
        method = 'PUT';
        record.id = editIndex;
    } else {
        url = '/.netlify/functions/save-record';
        method = 'POST';
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            await loadRecords();
            clearFormPacotes();
        } else {
            alert(`Erro: ${result.message}`);
        }
    } catch (error) {
        alert('Erro ao se comunicar com o servidor.');
        console.error('Erro na requisição:', error);
    }
}

async function editRecord(id) {
    const recordToEdit = records.find(r => r.id === id);
    if(recordToEdit) {
        document.getElementById('date-pacotes').value = recordToEdit.record_date;
        document.getElementById('quantity-pacotes').value = recordToEdit.quantity;
        document.getElementById('route-pacotes').value = recordToEdit.route || recordToEdit.initials || '';
        document.getElementById('driver-pacotes').value = recordToEdit.driver;
        editIndex = id;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function addQuantity(id) {
    const quantityToAdd = prompt("Quantos pacotes você deseja somar?");
    
    if (quantityToAdd !== null && !isNaN(quantityToAdd) && quantityToAdd !== "") {
        try {
            const response = await fetch('/.netlify/functions/add-quantity', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, quantityToAdd: Number(quantityToAdd) })
            });
            const result = await response.json();

            if (response.ok) {
                alert(result.message);
                await loadRecords();
            } else {
                alert(`Erro: ${result.message}`);
                console.error('Erro na requisição:', result);
            }
        } catch (error) {
            alert('Erro ao se comunicar com o servidor.');
            console.error('Erro na requisição:', error);
        }
    } else if (quantityToAdd !== null) {
        alert("Por favor, insira um número válido.");
    }
}

async function deleteRecord(id) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        try {
            const response = await fetch(`/.netlify/functions/delete-record?id=${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            
            if (response.ok) {
                alert(result.message);
                await loadRecords();
            } else {
                alert(`Erro: ${result.message}`);
                console.error('Erro na requisição:', result);
            }
        } catch (error) {
            alert('Erro ao se comunicar com o servidor.');
            console.error('Erro na requisição:', error);
        }
    }
}

// FUNÇÕES DE MANIPULAÇÃO DE DADOS E FORMULÁRIO (RESTO DO CÓDIGO)
function clearFormPacotes() {
    document.getElementById('date-pacotes').value = new Date().toLocaleDateString('en-CA');
    document.getElementById('quantity-pacotes').value = '';
    document.getElementById('route-pacotes').value = '';
    document.getElementById('driver-pacotes').value = '';
    editIndex = -1;
}

function filterRecords() {
    const filterDate = document.getElementById('filter-date').value;
    const filterDriver = document.getElementById('filter-driver').value;
    const tableRows = document.querySelectorAll('#tableBody .record-row');

    tableRows.forEach(row => {
        const rowDate = row.children[0].textContent.trim();
        const rowDriver = row.children[2].textContent.trim();
        const fullRowDate = row.children[0].querySelector('small').textContent.trim();
        
        const dateMatch = !filterDate || formatFullDate(filterDate) === fullRowDate;
        const driverMatch = !filterDriver || rowDriver.toLowerCase().includes(filterDriver.toLowerCase());
        
        if (dateMatch && driverMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    calculateTotalByDate(filterDate);
}

function showRouteDetails(date, route) {
    const routeDetails = records.filter(record => record.record_date === date && record.route === route);
    if (routeDetails.length > 0) {
        let detailsHtml = `<h3>Detalhes da Rota - ${route}</h3>`;
        detailsHtml += `<table><thead><tr><th>Motorista</th><th>Quantidade</th></tr></thead><tbody>`;
        routeDetails.forEach(detail => {
            detailsHtml += `<tr><td>${detail.driver}</td><td>${detail.quantity}</td></tr>`;
        });
        detailsHtml += `</tbody></table>`;
        document.getElementById('details-pacotes').innerHTML = detailsHtml;
        window.location.href = '#details-pacotes';
    } else {
        document.getElementById('details-pacotes').innerHTML = '';
    }
}

// RESTO DO CÓDIGO DA PÁGINA
function calculateTotals() {
    const totalParadas = document.getElementById('paradas-table-body').querySelectorAll('tr').length;
    document.getElementById('totalParadasCount').textContent = totalParadas;
}

// Funções para a aba de "Paradas"
function saveStopRecord() {
    const date = document.getElementById('date-paradas').value;
    const driver = document.getElementById('driver-paradas').value;
    const client = document.getElementById('client-paradas').value;
    const time = document.getElementById('time-paradas').value;
    if (date && driver && client && time) {
        const stopRecord = { date, driver, client, time };
        let stopRecords = JSON.parse(localStorage.getItem('stopRecords')) || [];
        stopRecords.push(stopRecord);
        localStorage.setItem('stopRecords', JSON.stringify(stopRecords));
        clearFormParadas();
        loadStopRecords();
        alert('Registro de parada salvo com sucesso!');
    } else {
        alert('Por favor, preencha todos os campos.');
    }
}

function loadStopRecords() {
    const stopRecords = JSON.parse(localStorage.getItem('stopRecords')) || [];
    const tableBody = document.getElementById('paradas-table-body');
    tableBody.innerHTML = '';
    stopRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    stopRecords.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatFullDate(record.date)}</td>
            <td>${record.driver}</td>
            <td>${record.client}</td>
            <td>${record.time}</td>
            <td class="actions">
                <button class="delete-btn" onclick="deleteStopRecord(${index})">-</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    calculateTotals();
}

function deleteStopRecord(index) {
    if (confirm('Tem certeza que deseja excluir este registro de parada?')) {
        let stopRecords = JSON.parse(localStorage.getItem('stopRecords')) || [];
        stopRecords.splice(index, 1);
        localStorage.setItem('stopRecords', JSON.stringify(stopRecords));
        loadStopRecords();
    }
}

function clearFormParadas() {
    document.getElementById('date-paradas').value = new Date().toLocaleDateString('en-CA');
    document.getElementById('driver-paradas').value = '';
    document.getElementById('client-paradas').value = '';
    document.getElementById('time-paradas').value = '';
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
    // Definir a data de hoje nos campos
    const today = new Date().toLocaleDateString('en-CA');
    document.getElementById('total-date-filter').value = today;
    document.getElementById('date-pacotes').value = today;
    document.getElementById('date-paradas').value = today;

    // Carregar os dados do banco de dados ao iniciar a página
    loadRecords();
    loadStopRecords();
    
    // Configurar os listeners para os botões e filtros
    document.getElementById('save-pacotes').addEventListener('click', addOrUpdateRecord);
    document.getElementById('clear-pacotes').addEventListener('click', clearFormPacotes);
    document.getElementById('filter-date').addEventListener('change', filterRecords);
    document.getElementById('filter-driver').addEventListener('input', filterRecords);

    // Funções da aba de paradas
    document.getElementById('save-paradas').addEventListener('click', saveStopRecord);
    document.getElementById('clear-paradas').addEventListener('click', clearFormParadas);

    // Configuração para alternar entre as abas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');

            if (button.dataset.tab === 'pacotes') {
                loadRecords();
            } else if (button.dataset.tab === 'paradas') {
                loadStopRecords();
            }
        });
    });

    // Inicia a página na aba de pacotes
    document.getElementById('pacotes-tab-btn').click();
});
