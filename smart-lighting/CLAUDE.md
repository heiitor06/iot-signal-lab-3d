# Smart Lighting Lab 3D (projeto)

Aplicação acadêmica (não é site de cliente). React 19 + TS estrito + Vite + Tailwind v4 + three 0.182 + R3F 9 + drei 10 + zustand + Recharts + KaTeX. Sem backend. Mesma base e padrões do `../lab-3d/`.

- Matemática em `src/simulation/` (sem React/Three), testada em `tests/`. Rodar `npm test` depois de mexer.
- Laço discreto Δt = 10 ms (`engine.ts`), forma exata da EDO por passo. Faixas de τ, K e K_p em `lib/validation.ts` garantem estabilidade do laço; mexer nelas exige rever o teste de pior caso.
- O motor vive fora do React. A cena lê `liveValues()` a cada quadro; rótulos (`LiveValue`), HUD, métricas, diagrama e telas 3D leem o retrato `sim` (10 Hz); gráficos `chartTime` (4 Hz). Não ler `engine` direto para exibir números.
- Fim de evento (sol/anoitecer) muda `config.externalLux` dentro de `publish`; mover o controle de L_ext cancela o evento.
- Sem `StrictMode` e todo `Html` com `portal={labelPortal}` (mesmos motivos do lab-3d). `three` fixado em 0.182.0.
- Paredes só com face interna (casa de bonecas) + teto invisível que só projeta sombra: sem ele o sol entra por cima da parede.
- Cartão do roteiro: a câmera desloca o centro da imagem (`viewInsets` + `setViewOffset`) para a sala ficar acima dele.
- Gráfico de controle sem eixo duplo: u(t) e e(t) em painéis empilhados (regra da skill dataviz).
- Pendências e histórico: `PROGRESSO.md`.
