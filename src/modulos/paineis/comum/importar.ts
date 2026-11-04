/**
 * Leitura de tabelas no navegador: CSV/TXT (separador detectado), texto colado
 * do Excel (tabulação) e .xlsx. Nada sai da máquina - o arquivo é lido aqui.
 *
 * O .xlsx é um zip de XMLs. Para não depender de biblioteca externa, este módulo
 * abre o zip (DecompressionStream "deflate-raw", nativo do navegador), lê a
 * primeira planilha e as strings compartilhadas. Fórmulas entram pelo último
 * valor calculado que o Excel gravou; datas chegam como número de série (o
 * painel converte - ver lerData em rejeicao-nfe/modelo.ts).
 */

export interface Tabela {
  colunas: string[];
  linhas: string[][];
  origem: string;
}

/** Separa um texto delimitado respeitando aspas ("a;b" fica numa célula só). */
export function lerTextoDelimitado(texto: string, origem: string): Tabela {
  const limpo = texto.replace(/^﻿/, '');
  const primeira = limpo.split(/\r?\n/, 1)[0] ?? '';
  const candidatos = ['\t', ';', ',', '|'];
  const sep = candidatos.reduce((melhor, c) => (primeira.split(c).length > primeira.split(melhor).length ? c : melhor), candidatos[0]);

  const linhas: string[][] = [];
  let linha: string[] = [];
  let celula = '';
  let aspas = false;
  for (let i = 0; i < limpo.length; i++) {
    const ch = limpo[i];
    if (aspas) {
      if (ch === '"') {
        if (limpo[i + 1] === '"') { celula += '"'; i++; } else aspas = false;
      } else celula += ch;
    } else if (ch === '"' && celula === '') {
      aspas = true;
    } else if (ch === sep) {
      linha.push(celula); celula = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && limpo[i + 1] === '\n') i++;
      linha.push(celula); celula = '';
      linhas.push(linha); linha = [];
    } else celula += ch;
  }
  if (celula !== '' || linha.length) { linha.push(celula); linhas.push(linha); }
  const naoVazias = linhas.filter((l) => l.some((c) => c.trim() !== ''));
  const [cabecalho = [], ...dados] = naoVazias;
  return { colunas: cabecalho.map((c, i) => c.trim() || `Coluna ${i + 1}`), linhas: dados, origem };
}

// ---------------------------------------------------------------- .xlsx

interface EntradaZip {
  nome: string;
  metodo: number;
  tamanhoComprimido: number;
  inicioLocal: number;
}

function lerZip(buf: ArrayBuffer): Map<string, EntradaZip> {
  const dv = new DataView(buf);
  let fimDir = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { fimDir = i; break; }
  }
  if (fimDir < 0) throw new Error('Arquivo .xlsx inválido (não é um zip).');
  const total = dv.getUint16(fimDir + 10, true);
  let p = dv.getUint32(fimDir + 16, true);
  const dec = new TextDecoder();
  const entradas = new Map<string, EntradaZip>();
  for (let i = 0; i < total; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const metodo = dv.getUint16(p + 10, true);
    const tamanhoComprimido = dv.getUint32(p + 20, true);
    const tamNome = dv.getUint16(p + 28, true);
    const tamExtra = dv.getUint16(p + 30, true);
    const tamComentario = dv.getUint16(p + 32, true);
    const inicioLocal = dv.getUint32(p + 42, true);
    const nome = dec.decode(new Uint8Array(buf, p + 46, tamNome));
    entradas.set(nome, { nome, metodo, tamanhoComprimido, inicioLocal });
    p += 46 + tamNome + tamExtra + tamComentario;
  }
  return entradas;
}

async function extrair(buf: ArrayBuffer, e: EntradaZip): Promise<string> {
  const dv = new DataView(buf);
  const inicio = e.inicioLocal + 30 + dv.getUint16(e.inicioLocal + 26, true) + dv.getUint16(e.inicioLocal + 28, true);
  const dados = new Uint8Array(buf, inicio, e.tamanhoComprimido);
  if (e.metodo === 0) return new TextDecoder().decode(dados);
  if (e.metodo !== 8) throw new Error('Compressão do .xlsx não suportada.');
  const fluxo = new Blob([dados]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return await new Response(fluxo).text();
}

function xml(texto: string): Document {
  return new DOMParser().parseFromString(texto, 'application/xml');
}

function indiceColuna(ref: string): number {
  const letras = ref.replace(/[0-9]/g, '');
  let n = 0;
  for (const l of letras) n = n * 26 + (l.charCodeAt(0) - 64);
  return n - 1;
}

export async function lerXlsx(buf: ArrayBuffer, origem: string): Promise<Tabela> {
  const zip = lerZip(buf);
  const pegar = async (nome: string) => {
    const e = zip.get(nome);
    return e ? await extrair(buf, e) : '';
  };

  // Primeira planilha na ordem do livro (workbook.xml + rels), não a primeira do zip.
  let caminho = 'xl/worksheets/sheet1.xml';
  const livro = await pegar('xl/workbook.xml');
  const rels = await pegar('xl/_rels/workbook.xml.rels');
  if (livro && rels) {
    const primeira = xml(livro).getElementsByTagName('sheet')[0];
    const rid = primeira?.getAttribute('r:id') ?? primeira?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    for (const r of Array.from(xml(rels).getElementsByTagName('Relationship'))) {
      if (r.getAttribute('Id') === rid) {
        const alvo = (r.getAttribute('Target') ?? '').replace(/^\//, '');
        caminho = alvo.startsWith('xl/') ? alvo : 'xl/' + alvo;
      }
    }
  }

  const compartilhadas: string[] = [];
  const sst = await pegar('xl/sharedStrings.xml');
  if (sst) {
    for (const si of Array.from(xml(sst).getElementsByTagName('si'))) {
      compartilhadas.push(Array.from(si.getElementsByTagName('t')).map((t) => t.textContent ?? '').join(''));
    }
  }

  const planilha = await pegar(caminho);
  if (!planilha) throw new Error('Não encontrei a planilha dentro do .xlsx.');
  const linhas: string[][] = [];
  for (const row of Array.from(xml(planilha).getElementsByTagName('row'))) {
    const linha: string[] = [];
    for (const c of Array.from(row.getElementsByTagName('c'))) {
      const idx = indiceColuna(c.getAttribute('r') ?? '');
      const tipo = c.getAttribute('t');
      let valor = '';
      if (tipo === 'inlineStr') {
        valor = Array.from(c.getElementsByTagName('t')).map((t) => t.textContent ?? '').join('');
      } else {
        const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
        valor = tipo === 's' ? (compartilhadas[Number(v)] ?? '') : v;
      }
      while (linha.length < idx) linha.push('');
      linha[idx >= 0 ? idx : linha.length] = valor;
    }
    linhas.push(linha);
  }
  const naoVazias = linhas.filter((l) => l.some((c) => String(c ?? '').trim() !== ''));
  const [cabecalho = [], ...dados] = naoVazias;
  return { colunas: cabecalho.map((c, i) => String(c ?? '').trim() || `Coluna ${i + 1}`), linhas: dados, origem };
}

/** Abre o arquivo escolhido pelo usuário, pelo tipo. */
export async function lerArquivo(arquivo: File): Promise<Tabela> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith('.xlsx') || nome.endsWith('.xlsm')) return lerXlsx(await arquivo.arrayBuffer(), arquivo.name);
  if (nome.endsWith('.xls')) throw new Error('Formato .xls antigo não é suportado: salve como .xlsx ou CSV.');
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  // CSV do Excel brasileiro costuma vir em Windows-1252; UTF-8 inválido cai nele.
  let texto: string;
  try {
    texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    texto = new TextDecoder('windows-1252').decode(bytes);
  }
  return lerTextoDelimitado(texto, arquivo.name);
}
