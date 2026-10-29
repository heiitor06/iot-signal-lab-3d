# IoT Signal Lab 3D (projeto)

Aplicação acadêmica (não é site de cliente). React 19 + TS estrito + Vite + Tailwind v4 + three 0.182 + R3F 9 + drei 10 + zustand + Recharts + KaTeX. Sem backend.

- Matemática em `src/simulation/` (sem React/Three), testada em `tests/`. Rodar `npm test` depois de mexer.
- O motor (`engine` em `store/simulationStore.ts`) vive fora do React. A cena lê o motor a cada quadro; a interface recebe o retrato `sim` a 10 Hz e os gráficos `chartTime` a 4 Hz.
- Telas 3D, rótulos (`LiveValue`), métricas e gráficos leem o mesmo retrato: os números batem. Não ler `engine` direto para exibir números.
- `three` fixado em 0.182.0: a partir do r183 o `THREE.Clock` (usado pelo R3F 9.8) gera aviso no console.
- Sem `StrictMode` (`main.tsx`): a montagem dupla do React 19 fazia o `Html` do drei desmontar raízes durante a renderização. Todo `Html` usa `portal={labelPortal}` (contêiner estável): sem isso rótulos sumiam.
- Regra `react/immutability` desligada só em `src/components/three/` (.oxlintrc.json): mutar materiais/geometrias no `useFrame` é o padrão do R3F.
- Zonas do canal (`CHANNEL_ZONES`) definem ao mesmo tempo a matemática do pulso e a posição 3D do ruído e do filtro.
- Medir desempenho só no build e com a aba em primeiro plano (aba de fundo roda a ~1 fps).
- Pendências e histórico: `PROGRESSO.md`.
