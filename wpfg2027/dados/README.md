# Dados de origem

- `frequencia-2025-10-outubro.txt` … `frequencia-2026-08-agosto.txt` — texto extraído
  das seis folhas mensais de presença enviadas (`pdftotext -layout`).
- `frequencia-consolidada.csv` — 188 atletas, presenças e taxa por mês, ordenado por frequência.
- `sessoes.json` — sessões apuradas por mês.
- `levantamento.py` — lê as folhas, apura as sessões e gera o CSV.
- `gerar_docx.js` — monta o `.docx` a partir do CSV (`npm install docx` antes de rodar).

Nenhum número foi digitado à mão: tudo sai dos arquivos acima, e reexecutar os
dois scripts reproduz o documento.
