// =========================
// CORTE10 - CLIENTE
// =========================

let horarioSelecionado = null;

// -------------------------
// Carregar Serviços
// -------------------------
async function carregarServicos() {

    const listaServicos =
        document.getElementById("listaServicos");

    const selectServico =
        document.getElementById("servicoCliente");

    listaServicos.innerHTML = "";
    selectServico.innerHTML =
        '<option value="">Selecione um serviço</option>';

    const { data, error } = await supabaseClient
        .from("servicos")
        .select("*")
        .eq("ativo", true)
        .order("preco");

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(servico => {

        listaServicos.innerHTML += `
        <div class="service-card">
            <h3>${servico.nome}</h3>
            <p class="price">
                R$ ${Number(servico.preco).toFixed(2)}
            </p>
            <p>
                ${servico.descricao || ""}
            </p>
        </div>
        `;

        selectServico.innerHTML += `
        <option value="${servico.id}">
            ${servico.nome}
        </option>
        `;
    });

}

// -------------------------
// Carregar Horários
// -------------------------
async function carregarHorarios() {

    const lista =
        document.getElementById("listaHorarios");

    lista.innerHTML = "";

    const hoje =
        new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseClient
        .from("horarios")
        .select("*")
        .eq("data", hoje)
        .order("hora");

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(horario => {

        let classe = "available";

        if (horario.status === "ocupado") {
            classe = "occupied";
        }

        if (horario.status === "pendente") {
            classe = "pending";
        }

        const card =
            document.createElement("div");

        card.className =
            `time-card ${classe}`;

        card.textContent =
            horario.hora;

        if (horario.status === "livre") {

            card.addEventListener(
                "click",
                () => selecionarHorario(
                    horario.id,
                    horario.hora,
                    card
                )
            );

        }

        lista.appendChild(card);

    });

}

// -------------------------
// Selecionar Horário
// -------------------------
function selecionarHorario(
    id,
    hora,
    elemento
) {

    document
        .querySelectorAll(".time-card")
        .forEach(card => {

            card.style.border =
                "none";

        });

    elemento.style.border =
        "3px solid #d4af37";

    horarioSelecionado = {
        id,
        hora
    };

}

// -------------------------
// Agendar
// -------------------------
async function agendar(
    event
) {

    event.preventDefault();

    const nome =
        document
        .getElementById(
            "nomeCliente"
        )
        .value
        .trim();

    const telefone =
        document
        .getElementById(
            "telefoneCliente"
        )
        .value
        .trim();

    const servicoId =
        document
        .getElementById(
            "servicoCliente"
        )
        .value;

    if (!nome) {
        alert("Informe seu nome.");
        return;
    }

    if (!telefone) {
        alert("Informe seu WhatsApp.");
        return;
    }

    if (!servicoId) {
        alert("Selecione um serviço.");
        return;
    }

    if (!horarioSelecionado) {
        alert("Selecione um horário.");
        return;
    }

    const hoje =
        new Date()
        .toISOString()
        .split("T")[0];

    // cria agendamento
    const { error } =
        await supabaseClient
            .from("agendamentos")
            .insert({
                nome,
                telefone,
                servico_id:
                    Number(servicoId),
                data: hoje,
                hora:
                    horarioSelecionado.hora,
                status:
                    "pendente"
            });

    if (error) {

        console.error(error);

        alert(
            "Erro ao agendar."
        );

        return;
    }

    // ocupa horário
    await supabaseClient
        .from("horarios")
        .update({
            status: "pendente"
        })
        .eq(
            "id",
            horarioSelecionado.id
        );

    alert(
        "Agendamento enviado!"
    );

    // WhatsApp
    const mensagem =
`Olá!

Novo agendamento:

Nome: ${nome}
Telefone: ${telefone}
Horário: ${horarioSelecionado.hora}`;

    window.open(
        `https://wa.me/5575997142719?text=${encodeURIComponent(mensagem)}`,
        "_blank"
    );

    document
        .getElementById(
            "formAgendamento"
        )
        .reset();

    horarioSelecionado = null;

    carregarHorarios();

}

// -------------------------
// Tempo Real
// -------------------------
function realtime() {

    supabaseClient
        .channel(
            "horarios-realtime"
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "horarios"
            },
            () => {

                carregarHorarios();

            }
        )
        .subscribe();

}

// -------------------------
// Inicialização
// -------------------------
document
    .getElementById(
        "formAgendamento"
    )
    .addEventListener(
        "submit",
        agendar
    );

carregarServicos();
carregarHorarios();
realtime();
