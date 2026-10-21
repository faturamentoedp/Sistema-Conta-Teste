import { NextResponse } from 'next/server';
import { calcular_fatura, normalizar_tarifas, resolver_tarifas } from '@/lib/motor/calculo.js';

// O motor de cálculo vive em src/lib/motor/calculo.js, compartilhado com a
// versão publicada. As tarifas vêm de src/lib/motor/vigencias.js, gerado do
// export oficial da ANEEL por scripts/exportar-vigencias.py - a rota só recebe
// os parâmetros e devolve o resultado.

export async function POST(request: Request) {
    try {
        let params;
        try {
            params = await request.json();
        } catch {
            return NextResponse.json({ erro: "Corpo da requisição inválido: envie um JSON com os parâmetros da simulação." }, { status: 400 });
        }

        const distribuidora = (params.distribuidora || "ES").toUpperCase();
        const categoria = (params.categoria || "B1C").toUpperCase();

        // Entrada inválida vira 400 com texto claro. Antes, uma data vazia
        // virava "Invalid Date" e o motor seguia calculando com a tarifa mais
        // recente: devolvia um total plausível (R$ 105,36 para 100 kWh) sem
        // nenhuma relação com um período real.
        const ant = new Date(params.data_leitura_anterior);
        const atu = new Date(params.data_leitura_atual);
        if (isNaN(ant.getTime()) || isNaN(atu.getTime())) {
            return NextResponse.json({ erro: "Informe as datas de leitura anterior e atual." }, { status: 400 });
        }
        if (atu.getTime() <= ant.getTime()) {
            return NextResponse.json({ erro: "A leitura atual precisa ser posterior à leitura anterior." }, { status: 400 });
        }
        if (distribuidora !== "ES" && distribuidora !== "SP") {
            return NextResponse.json({ erro: `Distribuidora "${distribuidora}" não suportada (use ES ou SP).` }, { status: 400 });
        }
        for (const campo of ["consumo_kwh", "consumo_reservado", "consumo_ponta", "consumo_fora_ponta", "consumo_intermediario"]) {
            const v = Number(params[campo] ?? 0);
            if (!Number.isFinite(v) || v < 0) {
                return NextResponse.json({ erro: `Valor inválido em ${campo}: informe um consumo em kWh maior ou igual a zero.` }, { status: 400 });
            }
        }

        const linhas_tarifa = resolver_tarifas(
            distribuidora,
            categoria,
            new Date(params.data_leitura_anterior),
            new Date(params.data_leitura_atual)
        );

        const resultado = calcular_fatura(params, normalizar_tarifas(linhas_tarifa, categoria));

        // O motor devolve { erro } quando falta parâmetro regulatório - hoje,
        // o percentual de compensação do GD3.
        if (resultado.erro) {
            return NextResponse.json({ erro: resultado.erro }, { status: 400 });
        }

        return NextResponse.json(resultado);

    } catch (e: unknown) {
        const mensagem = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ erro: "Erro interno: " + mensagem }, { status: 500 });
    }
}
