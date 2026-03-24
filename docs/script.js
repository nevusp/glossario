const API =
    window.location.hostname === ""
    ? "http://localhost:5050"
    : "https://glossario.onrender.com"

console.log(window.location.hostname)
console.log("API:", API)

let termos = []
let termoEditando = null

let paginaAtual = 1
const limite = 10
let totalPaginas = 1

// carrega os dados quando a página abre
async function carregarTermos(){

    const offset = (paginaAtual - 1) * limite

    const res = await fetch(`${API}/terms?limit=${limite}&offset=${offset}`)

    const data = await res.json()

    totalPaginas = Math.ceil(data.total / limite)

    termos = data.data

    renderizar(termos)

    atualizarPaginacao()
}

// renderiza resultados
function renderizar(lista){

    const div = document.getElementById("results")
    div.innerHTML = ""

    lista.forEach((term, index) => {

        div.innerHTML += `
        <div class="card">

            <div class="card-header" onclick="toggle(${index})">

                <span class="arrow" id="arrow-${index}">▼</span>

                <b>${term.WORD}</b>
                <p><b>Área:</b> ${term.AREA_PRIMARY}</p>
                <p>${term.DESCRIPTION_GENERAL}</p>

            </div>

            <div class="card-body hidden" id="body-${index}">

                <p><b>Subárea:</b> ${term.SUBAREA_PRIMARY}</p>
                <p><b>Tipo de conceito:</b> ${term.CONCEPT_TYPE}</p>
                <p><b>Ciências Sociais:</b><br>
                ${term.DESCRIPTION_SOCIAL_SCIENCES}</p>
                <p><b>Ciência de Dados:</b><br>
                ${term.DESCRIPTION_DATA_SCIENCE}</p>
                <p><b>Relação entre áreas:</b><br>
                ${term.CROSS_AREA_RELATION}</p>
                <p><b>Operacionalização em dados:</b><br>
                ${term.DATA_OPERATIONALIZATION}</p>
                <p><b>Exemplos:</b><br>
                ${term.EXAMPLES}</p>
                <p><b>Termos relacionados:</b><br>
                ${term.RELATED_TERMS}</p>
                <p><b>Referências:</b><br>
                ${term.REFERENCES_SOURCE}</p>

                <div class="card-actions">
                    <button onclick="editarTermo('${term.WORD}')">🖋 Editar</button>
                    <button onclick="excluirTermo('${term.WORD}')">🗑 Excluir</button>
                </div>

            </div>

        </div>
        `
    })
}

async function buscarSugestoes(){

    const texto = document.getElementById("search").value

    if(texto.length < 1){
        document.getElementById("suggestions").innerHTML = ""
        return
    }

    const res = await fetch(`${API}/terms?search=${texto}&limit=10`)

    const data = await res.json()

    mostrarSugestoes(data.data)
}

function mostrarSugestoes(lista){

    const div = document.getElementById("suggestions")

    div.innerHTML = ""

    lista.forEach(term => {

        div.innerHTML += `
        <div class="suggestion" onclick="selecionar('${term.WORD}')">
            ${term.WORD}
        </div>
        `
    })
}

function selecionar(word){

    document.getElementById("search").value = word

    document.getElementById("suggestions").innerHTML = ""

    buscarTermos()
}

async function buscarTermos(){

    const texto = document.getElementById("search").value

    if(texto.length === 0){
        paginaAtual = 1
        carregarTermos()
        return
    }

    const res = await fetch(`${API}/terms?search=${texto}`)

    const data = await res.json()

    renderizar(data.data)

    document.getElementById("suggestions").innerHTML = ""
}

function toggle(index){

    const body = document.getElementById(`body-${index}`)
    const arrow = document.getElementById(`arrow-${index}`)

    if(body.classList.contains("hidden")){
        body.classList.remove("hidden")
        arrow.innerText = "▲"
    }
    else{
        body.classList.add("hidden")
        arrow.innerText = "▼"
    }
}

function abrirFormulario(){
    document.getElementById("form-container").classList.remove("hidden")
}

function fecharFormulario(){
    document.getElementById("form-container").classList.add("hidden")
}

async function salvarTermo(){

    const termo = {
        WORD: document.getElementById("WORD").value,
        AREA_PRIMARY: document.getElementById("AREA_PRIMARY").value,
        SUBAREA_PRIMARY: document.getElementById("SUBAREA_PRIMARY").value,
        CONCEPT_TYPE: document.getElementById("CONCEPT_TYPE").value,
        DESCRIPTION_GENERAL: document.getElementById("DESCRIPTION_GENERAL").value,
        DESCRIPTION_SOCIAL_SCIENCES: document.getElementById("DESCRIPTION_SOCIAL_SCIENCES").value,
        DESCRIPTION_DATA_SCIENCE: document.getElementById("DESCRIPTION_DATA_SCIENCE").value,
        CROSS_AREA_RELATION: document.getElementById("CROSS_AREA_RELATION").value,
        DATA_OPERATIONALIZATION: document.getElementById("DATA_OPERATIONALIZATION").value,
        EXAMPLES: document.getElementById("EXAMPLES").value,
        RELATED_TERMS: document.getElementById("RELATED_TERMS").value,
        REFERENCES_SOURCE: document.getElementById("REFERENCES_SOURCE").value
    }

    let url = `${API}/terms`
    let method = "POST"

    if(termoEditando){
        url = `${API}/terms/${termoEditando}`
        method = "PUT"
    }

    const res = await fetch(url,{
        method: method,
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify(termo)
    })

    const data = await res.json()

    alert(data.message)
    termoEditando = null
    fecharFormulario()
    carregarTermos()
}

async function excluirTermo(word){

    if(!confirm("Deseja realmente excluir este termo?")){
        return
    }

    const res = await fetch(`${API}/terms/${word}`,{
        method:"DELETE"
    })

    const data = await res.json()

    alert(data.message)
    carregarTermos()
}

async function editarTermo(word){

    termoEditando = word

    const res = await fetch(`${API}/terms/${word}`)
    const data = await res.json()

    const term = data[0]

    document.getElementById("modal-title").innerText = "Editar termo"

    document.getElementById("modal").classList.remove("hidden")

    document.getElementById("WORD").value = term.WORD
    document.getElementById("AREA_PRIMARY").value = term.AREA_PRIMARY
    document.getElementById("SUBAREA_PRIMARY").value = term.SUBAREA_PRIMARY
    document.getElementById("CONCEPT_TYPE").value = term.CONCEPT_TYPE
    document.getElementById("DESCRIPTION_GENERAL").value = term.DESCRIPTION_GENERAL
    document.getElementById("DESCRIPTION_SOCIAL_SCIENCES").value = term.DESCRIPTION_SOCIAL_SCIENCES
    document.getElementById("DESCRIPTION_DATA_SCIENCE").value = term.DESCRIPTION_DATA_SCIENCE
    document.getElementById("CROSS_AREA_RELATION").value = term.CROSS_AREA_RELATION
    document.getElementById("DATA_OPERATIONALIZATION").value = term.DATA_OPERATIONALIZATION
    document.getElementById("EXAMPLES").value = term.EXAMPLES
    document.getElementById("RELATED_TERMS").value = term.RELATED_TERMS
    document.getElementById("REFERENCES_SOURCE").value = term.REFERENCES_SOURCE

}

function abrirFormulario(){

    termoEditando = null

    limparFormulario()

    document.getElementById("modal-title").innerText = "Novo termo"

    document.getElementById("modal").classList.remove("hidden")

}

function limparFormulario(){

    const campos = [

        "WORD",
        "AREA_PRIMARY",
        "SUBAREA_PRIMARY",
        "CONCEPT_TYPE",
        "DESCRIPTION_GENERAL",
        "DESCRIPTION_SOCIAL_SCIENCES",
        "DESCRIPTION_DATA_SCIENCE",
        "CROSS_AREA_RELATION",
        "DATA_OPERATIONALIZATION",
        "EXAMPLES",
        "RELATED_TERMS",
        "REFERENCES_SOURCE"

    ]

    campos.forEach(id => {
        document.getElementById(id).value = ""
    })

}

function fecharFormulario(){

    document.getElementById("modal").classList.add("hidden")

}

function atualizarPaginacao(total){

    const totalPaginas = Math.ceil(total / limite)

    const div = document.getElementById("paginacao")

    div.innerHTML = ""

    for(let i=1;i<=totalPaginas;i++){

        div.innerHTML += `
        <button onclick="irParaPagina(${i})"
        ${i===paginaAtual ? "style='font-weight:bold'" : ""}>
        ${i}
        </button>
        `
    }
}

function irParaPagina(p){

    paginaAtual = p

    carregarTermos()

}

function paginaAnterior(){

    if(paginaAtual > 1){

        paginaAtual--

        carregarTermos()

    }

}

function proximaPagina(){

    if(paginaAtual < totalPaginas){

        paginaAtual++

        carregarTermos()

    }

}

function atualizarPaginacao(){

    const div = document.getElementById("paginacao")

    div.innerHTML = ""

    // botão anterior
    div.innerHTML += `
    <button onclick="paginaAnterior()" 
    ${paginaAtual === 1 ? "disabled" : ""}>
    ◀ Anterior
    </button>
    `

    // janela de páginas (máx 5)
    const inicio = Math.max(1, paginaAtual - 2)
    const fim = Math.min(totalPaginas, paginaAtual + 2)

    for(let i=inicio;i<=fim;i++){

        div.innerHTML += `
        <button onclick="irParaPagina(${i})"
        ${i===paginaAtual ? "class='pagina-ativa'" : ""}>
        ${i}
        </button>
        `
    }

    // botão próximo
    div.innerHTML += `
    <button onclick="proximaPagina()"
    ${paginaAtual === totalPaginas ? "disabled" : ""}>
    Próximo ▶
    </button>
    `
}

window.onclick = function(event){

    const modal = document.getElementById("modal")

    if(event.target === modal){
        fecharFormulario()
    }

}

document.addEventListener("keydown", function(event){

    if(event.key === "Escape"){
        fecharFormulario()
    }

})

// iniciar
carregarTermos()