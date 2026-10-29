# PROGRESSO: IoT Signal Lab 3D

Iniciado em: 2026-10-29   Stack: React 19 + TS + Vite + Tailwind v4 + three/R3F/drei + zustand + Recharts + KaTeX (pedido explícito na spec)
Skill de estilo (Bloco B): nenhuma, Impeccable (operate + overdrive) + dataviz   Direção visual: painel técnico escuro, mesma paleta validada do app 2D

Projeto acadêmico, não é site de cliente. A spec de 42 seções do Carlos serviu de briefing, conteúdo e direção (F1–F4).

## Fases
| Fase | Status | Artefato | Aprovado em | Observações |
|---|---|---|---|---|
| F0 Preparação | [x] | este arquivo | 2026-10-29 | Sem skill específica de Three.js/R3F/WebGL instalada. `impeccable.exe` não executado (regra 8). |
| F1 Briefing | [x] | spec do pedido | pendente confirmação | `PRODUCT.md` não gerado. |
| F2 Estratégia e conteúdo | [x] | `lib/tour.ts`, painéis | pendente confirmação | Roteiro de 8 etapas segue a seção 37 da spec. |
| F3 Direção visual | [x] | tokens `src/index.css`, `layout.ts` | pendente confirmação | Direção única ditada pela spec. Sem 2–3 alternativas, sem `DESIGN.md`. |
| F4 Arquitetura | [x] | `README.md` | 2026-10-29 | Arquitetura da seção 30 seguida (+ `engine.ts`). |
| F5 Setup | [x] | scaffold | 2026-10-29 | |
| F6 Construção | [x] | `src/` | 2026-10-29 | |
| F7 Qualidade | [x] | relatório abaixo | 2026-10-29 | |
| F8 Verificação | [x] | saídas abaixo | 2026-10-29 | |
| F9 Entrega | [ ] | README + CLAUDE.md | aguardando Carlos | Sem deploy. |

## Autorizações de pular etapa
- 2026-10-29 | F1–F3 | Sem autorização explícita; a spec pediu implementação completa com tudo definido. Seguido pela regra 0.6.

## Decisões técnicas
- Projeto separado em `lab-3d/` (o app 2D da raiz ficou intacto).
- Sensor simulado de forma incremental com a discretização exata da EDO (permite degrau ao vivo); bate com a solução fechada nos instantes de amostragem.
- Ruído no canal (entre sensor e filtro), filtro no receptor, latência para a cadeia inteira: Z_gw(s) = e^{−T_d s}·H_f(s)·[H(s)X(s) + N(s)].
- Degrau automático em t₀ = 2 s (para o degrau aparecer); "Aplicar mudança" alterna entre T_f e T_i e cancela degraus pendentes.
- Perda de pacotes: filtro mantém a saída anterior (o pacote não chega ao receptor); sequência aleatória separada da do ruído.
- Latência mínima 0,5 s: com T_d ≈ 0 o pulso não teria trajeto visível.

## Relatório de qualidade (F7)
- Bugs achados e corrigidos: degrau manual preso atrás do automático; rótulos Html sumindo (contêiner do drei trocado após montar → `portal` estável); erro de console do React 19 com StrictMode; rótulos 3D atrasados em relação às telas (raiz separada → `LiveValue`); aviso `THREE.Clock` (three fixado em 0.182); rolagem horizontal no celular (MathML do KaTeX e itens de grid sem `min-w-0`); vista geral cortando o gateway (enquadramento pela proporção do canvas); FPS caindo pela metade por causa dos gráficos (4 Hz + congelar fora da tela + 240 pontos); coluna y(t) escondida atrás do sensor.
- Sincronia conferida no navegador: rótulos 3D = métricas em 7 leituras (rodando e pausado).
- Lighthouse (build, desktop): Acessibilidade 100, Boas práticas 100, SEO 100.
- Capturas conferidas: 360, 768, 1366 e 1920 px; sem rolagem horizontal.
- Desempenho (build, Intel UHD, 1366×768): ~46 fps na cena, 41–46 com gráficos; pior caso 250 pulsos a 4× ≈ 46 fps; relógio exato.
- Fluxos testados no navegador: Iniciar, Pausar, Continuar, Reiniciar, foco do teclado entre eles, degrau ao vivo, 7 presets, validação (τ = 0, α = 1,5, perda 30%), latência, perda, 5 vistas de câmera, Explicar sistema (Page Down), Modo apresentação (avanço automático + câmera), movimento reduzido.

## Verificação final (F8)
Ver mensagem de entrega (comandos rodados em 2026-10-29).

## Pendências
- [ ] Carlos confirmar a direção visual e se quer `PRODUCT.md`/`DESIGN.md`.
- [ ] Opcional: dividir bundles (aviso de chunk > 500 kB do Vite; a cena já carrega à parte).
- [ ] Opcional: deploy, só com ok do Carlos.

## Placeholders
- Nenhum.

## Créditos e licenças
- three.js, React Three Fiber, drei, zustand, React, Vite, Tailwind, Recharts, KaTeX | npm | MIT
- lucide-react | npm | ISC
- IBM Plex Sans / Mono | Fontsource | SIL OFL 1.1
