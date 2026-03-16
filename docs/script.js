const API =
    window.location.hostname === "localhost"
    ? "http://localhost:5050"
    : "https://glossario.onrender.com"

let termos = []
let termoEditando = null

// carrega os dados quando a página abre
async function carregarTermos(){

    const res = await fetch(`${API}/terms?limit=1000`)
    termos = await res.json()

    mostrarPrimeiros()
}

// mostra os 10 primeiros
function mostrarPrimeiros(){

    const primeiros = termos.slice(0,10)

    renderizar(primeiros)
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
                ${term.REFERENCES}</p>

                <div class="card-actions">
                    <button onclick="editarTermo('${term.WORD}')">🖋 Editar</button>
                    <button onclick="excluirTermo('${term.WORD}')">🗑 Excluir</button>
                </div>

            </div>

        </div>
        `
    })
}

// typeahead
function typeahead(){

    const texto = document.getElementById("search").value.toLowerCase()

    if(texto.length === 0){
        mostrarPrimeiros()
        return
    }

    const filtrados = termos.filter(t =>
        t.WORD.toLowerCase().includes(texto)
    )

    mostrarSugestoes(filtrados.slice(0,10))
}

// mostrar sugestões
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

// selecionar termo da lista
function selecionar(word){

    const termo = termos.find(t => t.WORD === word)

    renderizar([termo])

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
        REFERENCES: document.getElementById("REFERENCES").value
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
    document.getElementById("REFERENCES").value = term.REFERENCES

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
        "REFERENCES"

    ]

    campos.forEach(id => {
        document.getElementById(id).value = ""
    })

}

function fecharFormulario(){

    document.getElementById("modal").classList.add("hidden")

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