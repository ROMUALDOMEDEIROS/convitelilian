import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildTablePdf } from '../../shared/pdf.js';
import { TABLES } from '../../shared/schema.js';

/**
 * Retenção dos turnos no banco.
 *
 * O banco guarda os últimos N dias de cada folha. Ao passar disso, o dia é
 * gravado como PDF numa pasta em disco e só então removido do banco.
 *
 * A ordem importa e é o ponto todo deste arquivo: **o PDF é escrito e
 * conferido antes do DELETE**. Se a gravação falhar — disco cheio, pasta sem
 * permissão — o dia continua no banco e o expurgo é tentado de novo na próxima
 * passada. Nunca se apaga um dia que não tenha cópia em disco.
 */

/** Quantos dias ficam no banco, contando o de hoje. */
export const RETENCAO_DIAS = 7;

/** "2026-08-25" a partir de um Date, no fuso local — o mesmo critério de dia
 *  que a tela usa ao gravar o turno. */
export function diaISO(data) {
  const p = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

/**
 * Primeiro dia que PERMANECE no banco. Com retenção de 7 e hoje = dia 25,
 * devolve o dia 19: de 19 a 25 são sete dias, e tudo anterior a 19 vence.
 */
export function diaDeCorte(hoje, dias = RETENCAO_DIAS) {
  const corte = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  corte.setDate(corte.getDate() - (dias - 1));
  return diaISO(corte);
}

/** Nome do arquivo de um dia: 2026-08-19-viaturas.pdf */
export function nomeDoArquivo(table, dia) {
  return `${dia}-${table.slug}.pdf`;
}

/**
 * Arquiva em PDF e remove do banco os dias vencidos das duas folhas.
 *
 * @param store    banco aberto por openDatabase
 * @param pasta    onde gravar os PDFs
 * @param hoje     data de referência; parametrizada para os testes
 * @param dias     tamanho da janela de retenção
 * @param onAviso  recebe as mensagens; por padrão, o console
 * @returns {{arquivados: string[], falhas: {arquivo: string, motivo: string}[]}}
 */
export function arquivarEExpurgar({
  store,
  pasta,
  hoje = new Date(),
  dias = RETENCAO_DIAS,
  onAviso = (msg) => console.log(msg),
}) {
  const destino = resolve(pasta);
  const corte = diaDeCorte(hoje, dias);
  const arquivados = [];
  const falhas = [];

  for (const table of TABLES) {
    const vencidos = store.listDaysBefore(table.id, corte);
    if (vencidos.length === 0) continue;

    for (const { dia } of vencidos) {
      const nome = nomeDoArquivo(table, dia);
      const caminho = join(destino, nome);

      try {
        const turno = store.load(table.id, dia);
        // Sumiu entre o listar e o carregar (outra instância expurgou): nada a
        // fazer, e nada a apagar.
        if (!turno) continue;

        // mkdir aqui, e não no topo, para uma execução sem nada a arquivar não
        // criar pasta vazia na máquina de quem nunca vai precisar dela
        mkdirSync(destino, { recursive: true });

        const doc = buildTablePdf(table, turno.header, turno.rows);
        writeFileSync(caminho, Buffer.from(doc.output('arraybuffer')));

        // Confere que o arquivo existe e não saiu vazio ANTES de apagar.
        if (!existsSync(caminho) || statSync(caminho).size === 0) {
          throw new Error('o PDF não foi gravado ou saiu vazio');
        }

        store.deleteDay(table.id, dia);
        arquivados.push(nome);
      } catch (erro) {
        // O dia fica no banco e será tentado de novo na próxima passada.
        falhas.push({ arquivo: nome, motivo: erro.message });
      }
    }
  }

  if (arquivados.length > 0) {
    onAviso(
      `[arquivo] ${arquivados.length} dia(s) arquivado(s) em ${destino} e removido(s) do banco: ` +
        arquivados.join(', '),
    );
  }
  for (const { arquivo, motivo } of falhas) {
    onAviso(`[arquivo] FALHOU ao arquivar ${arquivo}: ${motivo}. O dia continua no banco.`);
  }

  return { arquivados, falhas };
}
