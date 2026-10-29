# IoT Signal Monitor (projeto)

Aplicação acadêmica, não é site de cliente. React 19 + TypeScript estrito + Vite + Tailwind v4 + Recharts + KaTeX. Sem backend.

- Matemática pura em `src/lib/` (sem React), testada em `tests/simulation.test.ts`. Rodar `npm test` depois de mexer nela.
- Toda a série é calculada uma vez por configuração (`generateSimulation`); o player (`useSimulationPlayer`) só decide até onde ela aparece.
- Ruído com semente (`createRng`): mudar o filtro não sorteia ruído novo. Não trocar por `Math.random`.
- Cores: tokens em `src/index.css` (escuro padrão, claro para projetor). O gráfico lê os tokens via `readChartColors()`; não duplicar hex.
- Paleta das séries validada com o script da skill dataviz (escuro passa tudo; claro tem aviso de contraste em 2 cores, compensado por legenda + aba Tabela).
- Gráfico: série dizimada uma vez (`decimateSeries`, ~800 pontos), preservando as amostras do degrau.
- Avaliar desempenho só no build (`npm run build && npm run preview`); o modo dev é ~2× mais lento.
- Pendências e histórico: `PROGRESSO.md`.
