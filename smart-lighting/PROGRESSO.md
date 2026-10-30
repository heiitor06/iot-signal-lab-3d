# PROGRESSO: Smart Lighting Lab 3D

Iniciado em: 2026-10-30   Stack: React 19 + TS + Vite + Tailwind v4 + three/R3F/drei + zustand + Recharts + KaTeX (pedido explícito na spec)
Skill de estilo (Bloco B): nenhuma. Direção visual: painel técnico escuro, mesma família visual dos dois apps anteriores (IBM Plex, tokens escuros).

Projeto acadêmico, não é site de cliente. A spec de 42 seções do Carlos serviu de briefing, conteúdo e direção (F1–F4).

## Fases
| Fase | Status | Artefato | Aprovado em | Observações |
|---|---|---|---|---|
| F0 Preparação | [x] | este arquivo | 2026-10-30 | Node 24.18 / npm 11.16. Sem skill específica de Three.js/R3F instalada. MCP claude-flow não conectou (não usado). |
| F1 Briefing | [x] | spec do pedido | pendente confirmação | `PRODUCT.md` não gerado. |
| F2 Estratégia e conteúdo | [x] | `lib/tour.ts`, painéis | pendente confirmação | Roteiro de 10 etapas segue a seção 29. |
| F3 Direção visual | [x] | tokens `src/index.css`, `three/layout.ts` | pendente confirmação | Direção única ditada pela spec; sem 2–3 alternativas, sem `DESIGN.md`. |
| F4 Arquitetura | [x] | `README.md` | 2026-10-30 | Arquitetura da seção 32 seguida (+ `engine.ts`, `DiagramMonitor`, `LuxIndicator`, `ControlWiring`). |
| F5 Setup | [x] | scaffold | 2026-10-30 | Configs e lockfile do lab-3d (mesmas versões já validadas). |
| F6 Construção | [x] | `src/` | 2026-10-30 | |
| F7 Qualidade | [~] | relatório abaixo | 2026-10-30 | Feito: dataviz (paleta validada pelo script), revisão visual no Chrome em 360/768/1366/1920, console. NÃO rodados: `/impeccable critique/audit/polish` e `web-design-guidelines`. |
| F8 Verificação | [x] | saídas abaixo | 2026-10-30 | |
| F9 Entrega | [x] | README + CLAUDE.md + deploy | 2026-10-30 | Deploy no GitHub Pages pedido pelo Carlos: https://heiitor06.github.io/iot-signal-lab-3d/smart-lighting/ (run 41093583057, build e deploy ok; conferido no navegador). |

## Autorizações de pular etapa
- 2026-10-30 | F1–F3 | Sem autorização explícita; a spec pediu implementação completa com tudo definido. Seguido pela regra 0.6.

## Decisões técnicas
- Projeto separado em `smart-lighting/` (lab-3d e o app 2D da raiz intactos).
- Unidades: u em %, K em lux/% (padrão 8 → lâmpada acrescenta até 800 lux), K_p em %/lux (padrão 2 → K·K_p = 16, e_ss = 17,6 lux com L_ext = 200).
- Integração: forma exata para u constante no passo (a spec permite "método numericamente melhor"); Euler mostrado no painel e comparado nos testes (< 0,5%).
- Brilho 3D da lâmpada segue y(t) (saída da EDO), não u: a lâmpada responde gradualmente, como pede a seção 42. Rótulo mostra u e y lado a lado.
- Sensor sobre a mesa (iluminância no plano de trabalho, onde 500 lux é a referência usual).
- Controle P puro (seção 13): erro residual explicado no painel de malha fechada; PI não implementado (fora do pedido).
- Diagrama: a luz externa entra num segundo somador depois de H(s) (L = L_ext + y), mais fiel que o diagrama simplificado da seção 18. Saturação indicada no fio de u.
- Marcos τ/3τ/5τ: no gráfico ao vivo só no modo manual (malha aberta, onde a fórmula vale) + gráfico analítico da resposta ao degrau sempre visível.
- Eventos: nuvem (−70% por 9 s e volta), sol intenso (→ 850 lux em 1,5 s), anoitecer (→ 10 lux em 20 s); etapa 8 do roteiro: queda 200 → 50 lux em 2 s, desfeita ao voltar etapas.

## Mudanças de escopo
- 2026-10-30 | Simplificação para o público (professor de Eng. Mecânica, pouco familiarizado com tecnologia), pedida pelo Carlos: os 7 presets (seção 31 da spec) viraram um botão "Voltar ao padrão"; métricas de 10 para 6 cartões (τ, K, Kp ficam nos controles); textos de ajuda encurtados; detalhes da malha fechada e do método numérico em "Ver mais" (fechados por padrão). Nenhuma fase reaberta além de F6–F8 (refeitas: testes, tsc, lint, build, conferência no Chrome).

## Relatório de qualidade (F7)
- Bugs achados e corrigidos: céu visível fora da janela; feixe de luz falso; serrilhado de autossombra nas paredes; sol entrando pela frente aberta e por cima da parede (cone estreito + teto só de sombra); rótulos 3D sobrepostos (reposicionados; no roteiro só o da etapa); cartão do roteiro cobrindo a sala (setViewOffset + zoom); HUD colidindo com as vistas em 640–1023 px; texto do erro encostando no bloco K_p; eixo do erro sem o zero; teste com degrau que saturava o comando (hipótese errada no teste, não no modelo).
- Teoria × simulação conferida na tela: L = 482, e = 17,6, u = 35% (300/17); nuvem 52% (2·440/17); anoitecer e = 28,8 (490/17); etapa 8 u = 52,9% (2·450/17); manual 90% → y = 720 = K·U₀.
- Sincronia 3D = HUD = métricas = diagrama conferida em regime e no meio de um transitório (L = 462 = 85 + 377, u = 76% = 2·38,1).
- Capturas: 360 (emulado), 768, 1366, 1920 px; scrollWidth = largura em todas.
- Desempenho (build, Intel UHD, 1366×768): ~50 fps com cena + gráficos, ~49 durante a nuvem; relógio exato (6,0 s simulados em 6 s).
- Fluxos testados: Iniciar/Pausar/Continuar/Reiniciar, 3 perturbações, preset Anoitecer, Manual ↔ Automático, campo numérico, 5 vistas, Passo a passo (10 etapas, Page Up/Down, voltar desfaz a perturbação), apresentação automática (troca de etapa e câmera em 9 s).
- Console (dev e build): sem erros nem avisos.

## Verificação final (F8), 2026-10-30
- `npx vitest run`: 26 passed (26)
- `npx tsc -b`: exit 0
- `npx oxlint`: sem avisos
- `npm run build`: ✓ built (aviso de chunk > 500 kB do Vite, igual ao lab-3d)
- Busca por console.log/TODO/lorem/debugger: nada

## Pendências
- [ ] Carlos decidir se quer as passadas `/impeccable` e `web-design-guidelines` (F7 do processo global).
- [ ] Carlos confirmar a direção visual e se quer `PRODUCT.md`/`DESIGN.md`.
- [ ] Opcional: dividir bundles (aviso de chunk > 500 kB).
- [x] Deploy feito em 2026-10-30 (workflow publica lab-3d na raiz e este app em /smart-lighting/).

## Placeholders
- Nenhum.

## Créditos e licenças
- three.js, React Three Fiber, drei, zustand, React, Vite, Tailwind, Recharts, KaTeX | npm | MIT
- lucide-react | npm | ISC
- IBM Plex Sans / Mono | Fontsource | SIL OFL 1.1
- Paleta das séries | referência da skill dataviz, validada para o fundo escuro
