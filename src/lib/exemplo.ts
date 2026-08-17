import type { Row } from '../schema';

/** Linhas de exemplo, usadas só pelo botão do modo demonstração — permitem
 *  avaliar a tela e o PDF sem ter um arquivo à mão (útil no celular). */
export const EXEMPLOS: Record<'tabela1' | 'tabela2', Row[]> = {
  tabela1: [
    { entrada: '', saida: '07:37', interna: 'ETIOS APAM', externa: '', condutor: 'GOMES PTTC' },
    { entrada: '07:12', saida: '08:40', interna: '', externa: 'AO 42', condutor: 'MATIAS SGT' },
    { entrada: '09:05', saida: '', interna: 'APS 376', externa: '', condutor: 'VÂNIA ST' },
    { entrada: '10:20', saida: '11:45', interna: '', externa: 'UR 807', condutor: 'CERQUEIRA TEN' },
    { entrada: '13:02', saida: '', interna: 'ASG 188', externa: '', condutor: 'AGATANGELO PTTC' },
  ],
  tabela2: [
    {
      hora: '07:45',
      responsavel: 'JOÃO CARLOS DA SILVA',
      aluno: 'PEDRO HENRIQUE DA SILVA',
      serieTurma: '6º A',
      destino: 'SECRETARIA',
      autorizadoPor: '1º SGT MATIAS',
    },
    {
      hora: '08:20',
      responsavel: 'MARIA DAS GRAÇAS SOUZA',
      aluno: 'ANA BEATRIZ SOUZA',
      serieTurma: '9º B',
      destino: 'COORDENAÇÃO PEDAGÓGICA',
      autorizadoPor: 'MAIANE DANTAS',
    },
    {
      hora: '10:05',
      responsavel: 'ANTÔNIO JOSÉ ALBUQUERQUE',
      aluno: 'LUCAS ALBUQUERQUE',
      serieTurma: '7º C',
      destino: 'ENFERMARIA',
      autorizadoPor: '1º SGT MATIAS',
    },
  ],
};
