import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Proteção opcional por senha, usada quando o simulador fica exposto fora da
// rede local (túnel público). Só entra em ação se APP_SENHA estiver definida
// no .env.local - sem ela o comportamento continua o de sempre.
const NEGAR = new NextResponse('Acesso restrito ao Simulador de Faturas EDP.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Simulador EDP", charset="UTF-8"' }
});

export function proxy(request: NextRequest) {
    const senha_esperada = process.env.APP_SENHA;
    if (!senha_esperada) return NextResponse.next();

    const cabecalho = request.headers.get('authorization');
    if (!cabecalho || !cabecalho.startsWith('Basic ')) return NEGAR.clone();

    const credenciais = Buffer.from(cabecalho.slice(6), 'base64').toString('utf8');
    const separador = credenciais.indexOf(':');
    const senha_informada = separador >= 0 ? credenciais.slice(separador + 1) : '';

    if (senha_informada !== senha_esperada) return NEGAR.clone();
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
