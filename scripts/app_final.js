

console.log("#### app.js: carregado ####");

const PRIORIDADE_BAIXA = 1;
const PRIORIDADE_MEDIA = 2;
const PRIORIDADE_ALTA = 3;
const PRIORIDADE_INVALIDA = -1;

/***********
 * OBJETOS
 */
class Tarefa {
    constructor(id, detalhe, prioridade) {

        if (typeof id != "number") {
            throw new TypeError("Campo Id deve ser um número");
        }

        if ((prioridade < PRIORIDADE_BAIXA) || (prioridade > PRIORIDADE_ALTA)) {
            throw new TodoException("Prioridade deve estar entre os valores " + PRIORIDADE_BAIXA + " e " + PRIORIDADE_ALTA);
        }

        this.tarefaId = id;
        this.detalhe = detalhe;
        this.completa = false;
        this.prioridade = prioridade ?? PRIORIDADE_INVALIDA;
        this.prioridadeTexto = (prioridade == PRIORIDADE_BAIXA) ? "Baixa" : (prioridade == PRIORIDADE_MEDIA) ? "Média" : (prioridade == PRIORIDADE_ALTA) ? "Alta" : "Inválido";
    }
    mudaEstado() {
        this.completa = !this.completa;
    }
    toString() {
        return `${this.tarefaId} ::: [${this.prioridadeTexto}] ${this.detalhe}: ${this.completa ? "Terminada" : "Por fazer"}`;
    }
}

class TodoException {
    constructor(mensagem) {
        this.mensagem = mensagem;
        this.nome = "TodoException";
    }
}


/*************
 * VARIAVEIS GLOBAIS
 */
let listaTarefas = [];
let idGlobal = 1;


/**************
 * EVENT LISTENERS
 */
const novaTarefaBtn = $("#newTodoBtn")[0];
novaTarefaBtn.addEventListener("click", criaNovaTarefa);
novaTarefaBtn.addEventListener("click", limpaNewTodoInput);
novaTarefaBtn.addEventListener("click", refreshListaTarefas);

const filtrarBtn = $("#filtraLista")[0];
filtrarBtn.addEventListener("click", filtraTarefas);



/**************
 * EVENT HANDLERS
 */
function limpaNewTodoInput() {
    document.getElementById("newTodoInput").value = "";
}

function obtemPrioridadeUI() {
    let selectElement = document.getElementById("prioridade");
    let prioridade = selectElement.options[selectElement.selectedIndex].value;
    console.log("Prioridade em String: " + prioridade);
    prioridade = parseInt(prioridade);
    return prioridade;
}

function criaNovaTarefa() {
    let textoTarefa = document.getElementById("newTodoInput").value;
    let prioridade = obtemPrioridadeUI();
    
    console.log("Texto: " + textoTarefa);
    console.log("Prioridade: " + prioridade);
    console.log(typeof prioridade);

    /*
    if (prioridade == PRIORIDADE_INVALIDA) {
        alert("Escolha uma prioridade válida para a sua tarefa!"); 
    } else {
        adicionarTarefa(textoTarefa, prioridade);
        console.log(listaTarefas);
    }
    */

    adicionarTarefa(textoTarefa, prioridade);
    console.log(listaTarefas);
}

function refreshListaTarefas() {
    let listaOrdenada = ordenaListaTarefas();
    
    atualizaListaUI(listaOrdenada);
}

function filtraTarefas() {
    let prioridade = obtemPrioridadeUI();
    let listaFiltrada = filtraListaPorPrioridade(prioridade);
    
    atualizaListaUI(listaFiltrada);
}


/************************
 * DOM HANDLERS
 */

function atualizaListaUI(lista) {
    // limpa a div do conteúdo anterior
    document.getElementById("listaTodoDiv").innerHTML = "";

    const listaHTML = criaListaUI(lista);

    // adiciona novo conteúdo à div
    // HTML gerado pela função criaListaUI
    document.getElementById("listaTodoDiv").appendChild(listaHTML);
}

// criaListaUI: Recebe um array com Tarefas e retorna o elemento HTML criado 
// com todos os elmentos da lista
// Elemento HTML: 
// <ul>
//    <li>tarefa.toString()</li>
//    <li>tarefa.toString()</li>
// </ul>
function criaListaUI(lista) {
    //const ul = document.createElement("ul");
    const ul = $('<ul/>');
    for (const tarefa of lista) {
        //const li = document.createElement("li");
        const li = $('<li/>', {
            id: "tarefa-" + tarefa.tarefaId
        });
        
        //let button = document.createElement("button");
        let button = $('<button/>', {
            html: "Apagar",
            id: "btntarefa-" + tarefa.tarefaId
        });

        let liText = document.createTextNode(tarefa.toString());

        li.append(button);
        li.append(liText);

        // coloca a verde se a tarefa estiver completa
        if (tarefa.completa) {
            li.css("backgroundColor", "grey");
        }

        switch(tarefa.prioridade) {
            case PRIORIDADE_ALTA:
                li.css("color", "red");
                break;
            case PRIORIDADE_MEDIA:
                li.css("color", "blue");
                break;
            case PRIORIDADE_BAIXA:
                li.css("color", "green");
                break;
            default:
                li.css("color", "yellow");
        }

        ul.append(li);
    }

    ul.click(function(e) {
        if (e.target && e.target.nodeName == "LI") {
            console.log(e.target.id);
            // obter o id do li
            // fazer split pelo carácter "-"
            // obter o id da tarefa
            let tarefaId = e.target.id.split("-")[1];
            console.log(tarefaId);

            mudaEstadoTarefa(tarefaId);      
            refreshListaTarefas();      
        } else if (e.target && e.target.nodeName == "BUTTON") {
            let tarefaId = e.target.id.split("-")[1];
            console.log(tarefaId);
            removeTarefa(tarefaId);      
            refreshListaTarefas(); 
        }
    });


    return ul.get(0);
}


/***************
 * STORAGE
 */

function carregaIdGlobal() {
    if (typeof(Storage) !== "undefined") {
        if (localStorage.idGlobal) {
            idGlobal = parseInt(localStorage.idGlobal);
        }
    } else {
        console.warn("Storage indisponível no browser");
    }
}

function atualizaIdGlobal(id) {
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("idGlobal", id);
    } else {
        console.warn("Storage indisponível no browser");
    }
}


/***************
 * FUNÇÕES DA LISTA DE TAREFAS
 */

function adicionarTarefa(textoDaTarefa, prioridade) {
    let novaTarefa = null;

    try {
        novaTarefa = new Tarefa(idGlobal, textoDaTarefa, prioridade);    
    } catch(err) {
        if (err instanceof TodoException) {
            console.warn("Prioridade " + prioridade + " fora dos valores pretendidos. Tarefa será criada com prioridade " + PRIORIDADE_BAIXA);
            novaTarefa = new Tarefa(idGlobal, textoDaTarefa, PRIORIDADE_BAIXA);
        }
        if (err instanceof TypeError) {
            console.error(err.message);
        }
    }

    if (novaTarefa) {
        idGlobal++;
        atualizaIdGlobal(idGlobal);
        listaTarefas.push(novaTarefa);
    }
}

function removeTarefa(tarefaId) {
    let tarefaIDNumero = parseInt(tarefaId);

    if (isNaN(tarefaIDNumero)) {
        console.log(`Parametro tarefaId (${tarefaId}) inválido`);
        return;
    }

    for (let i = 0; i != listaTarefas.length; i++) {
        let elemento = listaTarefas[i];

        if (elemento.tarefaId === tarefaIDNumero) {
            let removido = listaTarefas.splice(i, 1);
            console.log("Item removido");
            console.log(removido);
            return;
        }
    }

}

function mudaEstadoTarefa(tarefaId) {
    let tarefaIDNumero = parseInt(tarefaId);

    if (isNaN(tarefaIDNumero)) {
        console.log(`Parametro tarefaId (${tarefaId}) inválido`);
        return;
    }

    // percorrer a lista de tarefas e mudar o estado ao encontrar
    // a tarefa com Id obtido no passo anterior
    for (let tarefa of listaTarefas) {
        
        if (tarefa.tarefaId === tarefaIDNumero) {
            console.log("Encontrei a tarefa");
            tarefa.mudaEstado();
            console.log(tarefa.toString());
            return tarefa.completa;
        }
    }
}

function ordenaListaTarefas() {
    let listaOrdenada = listaTarefas.sort((a, b) => {
        const detalheA = a.detalhe.toUpperCase();
        const detalheB = b.detalhe.toUpperCase();

        if (detalheA > detalheB) {
            return 1;
        } else if (detalheB > detalheA) {
            return -1;
        } 
        return 0;
    });
    return listaOrdenada;
}

function filtraListaPorPrioridade(prioridade) {
    if (prioridade === -1) {
        return listaTarefas;
    }

    let listaFiltrada = listaTarefas.filter(tarefa => tarefa.prioridade === prioridade);
    return listaFiltrada;
}

carregaIdGlobal();




/****************
 * FUNÇÕES DE DEBUG
 */
function testar() {
    /*
    let novaTarefa = new Tarefa("Texto da minha tarefa", 1);
    console.log(`>>> DEBUG ::: novaTarefa.detalhe - ${novaTarefa.detalhe}`); //Texto da minha tarefa
    console.log(`>>> DEBUG ::: novaTarefa.completa - ${novaTarefa.completa}`); //false

    novaTarefa.mudaEstado();
    console.log(`>>> DEBUG ::: novaTarefa.completa - ${novaTarefa.completa}`); //true

    novaTarefa.mudaEstado();
    console.log(`>>> DEBUG ::: novaTarefa.completa - ${novaTarefa.completa}`); //false

    novaTarefa.mudaEstado();
    console.log(`>>> DEBUG ::: novaTarefa.completa - ${novaTarefa.completa}`); //true

    let textoTarefa = document.getElementById("newTodoInput").value;
    console.log(`>>> DEBUG ::: textoTarefa - ${textoTarefa}`);
    */

    adicionarTarefa("Tarefa #1", 2);
    console.log(listaTarefas);

    adicionarTarefa("Tarefa #2", 3);
    console.log(listaTarefas);

    adicionarTarefa("Tarefa #3", 10);
    console.log(listaTarefas);

    for (let tarefa of listaTarefas) {
        console.log(tarefa.toString());
    }

    //listaTarefas.forEach(tarefa => console.log(tarefa.toString));
}

//testar();