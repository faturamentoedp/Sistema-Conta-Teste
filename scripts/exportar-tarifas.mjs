/**
 * Lê a dimensão de tarifas no SQL Server e gera src/lib/motor/tarifas.js,
 * usado pela versão autônoma (sem banco).
 *
 * Uso: npm run tarifas
 * Rode de novo a cada reajuste da ANEEL e gere o HTML outra vez.
 *
 * IMPORTANTE: a consulta abaixo é idêntica à da API (mesmo filtro, SEM ORDER BY)
 * e as linhas são gravadas na ordem em que o banco devolve. O motor usa a
 * primeira linha como fallback quando o nome do posto não bate, então mudar a
 * ordem mudaria os valores calculados.
 */
import sql from 'mssql';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const env = fs.readFileSync(path.join(raiz, '.env.local'), 'utf-8')
    .split('\n')
    .reduce((acc, linha) => {
        const idx = linha.indexOf('=');
        if (idx > 0) acc[linha.slice(0, idx).trim()] = linha.slice(idx + 1).trim().replace(/^"|"$/g, '');
        return acc;
    }, {});

const config = {
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    server: env.DB_SERVER,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: true, trustServerCertificate: true }
};

const pool = await sql.connect(config);

const chaves = await pool.query`
    SELECT DISTINCT Distribuidora, Title FROM ContaTeste_Dim_Tarifas
`;

const tarifas = {};
let total = 0;

for (const { Distribuidora, Title } of chaves.recordset) {
    const distribuidora = String(Distribuidora || '').trim();
    const categoria = String(Title || '').trim();
    if (!distribuidora || !categoria) continue;

    // Exatamente a mesma consulta da API, para a ordem das linhas ser a mesma.
    const { recordset } = await pool.query`
        SELECT
            Valor_TUSD as tusd,
            Valor_TE as te,
            Posto as posto
        FROM ContaTeste_Dim_Tarifas
        WHERE Title = ${categoria} AND Distribuidora = ${distribuidora}
    `;

    tarifas[distribuidora] ??= {};
    tarifas[distribuidora][categoria] = recordset.map((r) => ({
        posto: r.posto,
        tusd: Number(r.tusd),
        te: Number(r.te)
    }));
    total += recordset.length;
}

await sql.close();

const destino = path.join(raiz, 'src', 'lib', 'motor', 'tarifas.js');
fs.mkdirSync(path.dirname(destino), { recursive: true });

const gerado_em = new Date().toISOString().slice(0, 10);
const conteudo = `// GERADO AUTOMATICAMENTE por scripts/exportar-tarifas.mjs - não edite à mão.
// Fonte: ContaTeste_Dim_Tarifas (${env.DB_SERVER}/${env.DB_DATABASE})
// Gerado em: ${gerado_em} | ${total} linhas
//
// A ordem das linhas dentro de cada categoria importa: o motor usa a primeira
// como fallback quando o nome do posto não bate. Não reordene.

export const TARIFAS_GERADAS_EM = '${gerado_em}';

export const TARIFAS = ${JSON.stringify(tarifas, null, 4)};
`;

fs.writeFileSync(destino, conteudo, 'utf8');

console.log(`Categorias exportadas: ${chaves.recordset.length} | linhas: ${total}`);
console.log(`Gerado: ${path.relative(raiz, destino)}`);
for (const [dist, cats] of Object.entries(tarifas)) {
    for (const [cat, linhas] of Object.entries(cats)) {
        if (linhas.length > 1) {
            console.log(`  ${dist}/${cat}: fallback = "${linhas[0].posto}"`);
        }
    }
}
