import { NextResponse } from 'next/server';
import { calcular_fatura, normalizar_tarifas, resolver_tarifas } from '@/lib/motor/calculo.js';

// O motor de cálculo vive em src/lib/motor/calculo.js, compartilhado com a
// versão publicada. As tarifas vêm de src/lib/motor/vigencias.js, gerado do
// export oficial da ANEEL por scripts/exportar-vigencias.py - a rota só recebe
// os parâmetros e devolve o resultado.

export async function POST(request: Request) {
    try {
        const params = await request.json();

        const distribuidora = (params.distribuidora || "ES").toUpperCase();
        const categoria = (params.categoria || "B1C").toUpperCase();

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
