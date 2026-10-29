# PROGRESSO: IoT Signal Monitor (Transformada de Laplace em sensores IoT)

Iniciado em: 2026-10-29   Stack: React 19 + TypeScript estrito + Vite + Tailwind v4 + Recharts + KaTeX (pedido explícito no briefing; substitui o Next.js padrão)
Skill de estilo (Bloco B): nenhuma, apenas Impeccable (modo Operate) + dataviz   Direção visual aprovada: "Painel técnico escuro" (definida pelo briefing, ver F3)

Observação: projeto acadêmico, não é site de cliente. O briefing veio completo no pedido do Carlos (spec de 33 seções) e serviu de entrada para F1 a F4.

## Fases
| Fase | Status | Artefato | Aprovado em | Observações |
|---|---|---|---|---|
| F0 Preparação | [x] | este arquivo | 2026-10-29 | Node 24.18, npm 11.16, git iniciado. 16 skills de design presentes; Bloco A presente. Binário `impeccable.exe` NÃO executado (regra 8): referências lidas direto. |
| F1 Briefing | [x] | spec do pedido | pendente confirmação | `PRODUCT.md` não gerado (dependeria de rodar `impeccable init`); contexto consolidado abaixo. |
| F2 Estratégia e conteúdo | [x] | mapa abaixo | pendente confirmação | Textos didáticos escritos pelo Claude, conferidos matematicamente. |
| F3 Direção visual | [x] | tokens em `src/index.css` | pendente confirmação | Uma direção, ditada pelo briefing (dark, técnico, projetor). Sem 2–3 alternativas: ver "Autorizações". `DESIGN.md` não gerado; tokens abaixo. |
| F4 Arquitetura e plano | [x] | `README.md` (Estrutura) | 2026-10-29 | Arquitetura de componentes da spec seguida. |
| F5 Setup | [x] | scaffold Vite | 2026-10-29 | build passando antes das seções. |
| F6 Construção | [x] | `src/` | 2026-10-29 | |
| F7 Qualidade | [x] | relatório abaixo | 2026-10-29 | |
| F8 Verificação final | [x] | saídas abaixo | 2026-10-29 | |
| F9 Entrega e registro | [ ] | README + CLAUDE.md | aguardando Carlos | Falta o ok do Carlos (gate F9). Sem deploy. |

## Autorizações de pular etapa (só com pedido explícito do Carlos)
- 2026-10-29 | F1–F3 | NÃO houve autorização explícita. O pedido trouxe briefing, conteúdo e direção visual fechados ("dark mode, visual técnico…") e mandou implementar sem parar. Seguido pela regra 0.6 (pedido do Carlos prevalece). Itens a confirmar: `PRODUCT.md`/`DESIGN.md` separados e as 2–3 direções visuais alternativas.

## Briefing consolidado (F1)
- Público: professor e alunos de Computação numa aula de EDO; leitura em projetor e notebook.
- Objetivo: mostrar Problema real → EDO → Laplace → H(s) → simulação, com a Transformada como parte central.
- Tom: técnico, limpo, sem efeitos. Prioridade de telas: notebook, desktop, tablet, celular.

## Mapa da página (F2)
Topo (título, grandeza, Modo Didático, tema) → Cadeia de sinal ao vivo (5 blocos com H(s), H_f(s) e valores) → [Modo Didático, 7 passos] → Painel de sinais (controles + gráfico/tabela) e métricas | Cenários prontos + Configuração → Derivação de Laplace (6 passos) | Significado de τ (tabela de marcos).

## Tokens (F3)
- Escuro: bg #0d0f12, superfície #14171c / #1b1f26 / #252a33, linhas #272c35 / #3b424e, texto #eef0f3 / #b9bfc9 / #9098a4.
- Séries (escuro): real #3987e5 (tracejada), sensor #d95926, ruidoso #199e70, filtrado #c98500. Validado: CVD ΔE 8,4, visão normal ΔE 19,8, contraste ≥ 3:1.
- Claro (projetor): séries #2a78d6 #eb6834 #1baf7a #eda100; aviso de contraste < 3:1 em 2 cores, compensado por legenda permanente + aba Tabela.
- Tipografia: IBM Plex Sans (UI), IBM Plex Mono (números), KaTeX (fórmulas). Elemento assinatura: a cadeia de sinal ao vivo.

## Decisões técnicas
- Degrau em t₀ = 2 s no preset padrão (com t₀ = 0 o degrau não aparece no gráfico). A fórmula exibida inclui o deslocamento: y(t) = 40 − 20e^(−(t−2)/5).
- y(0) = 0 tratado como variável de desvio (ỹ = y − T_i), explicado no Passo 3; sem isso a derivação não leva à fórmula pedida.
- Ruído gaussiano com σ = A/√3 (mesma potência do uniforme de amplitude A). Semente fixa na abertura.
- α ↔ τ_f: α = Δt/(τ_f + Δt), exibido ao vivo.
- Configuração genérica (`initialValue`/`finalValue` em vez de `initialTemperature`) para atender a extensão a outros sensores; 4 perfis prontos.
- Extras não pedidos: tema claro, aba Tabela com exportação CSV, atalhos de teclado, botão "Novo ruído", seletor de grandeza.

## Relatório de qualidade (F7)
- Revisão `web-design-guidelines`: corrigidos foco fraco no campo numérico, falta de skip link, `name`/`autocomplete` nos campos, `transition-all`, `theme-color` no tema claro, `touch-action`, `translate="no"` na marca.
- Impeccable (craft-floor, operate): sem eyebrow, sem gradiente, sem cards aninhados, ícones de biblioteca, numerais tabulares, tema das superfícies do navegador.
- Bugs achados e corrigidos: métrica do caso 4 misturava atraso do filtro com ruído (causa confirmada por medição; trocada por z − LPF(y)); `\d` em template literal quebrava a fórmula; foco do teclado se perdia ao desabilitar "Iniciar"; faixa da cadeia de sinal criava rolagem horizontal; "°C" do eixo cortado; Passo 2 da derivação cortado; marcas tortas no eixo Y.
- Lighthouse (desktop, build): Acessibilidade 100, Boas práticas 100, SEO 91 → robots.txt adicionado depois.
- Capturas conferidas: 360, 768, 1366 e 1920 px; sem rolagem horizontal (scrollWidth = largura em todas).
- Desempenho (build de produção): demo 600 pontos ≈ 46–60 fps; 25.001 pontos a 10× ≈ 23 fps, relógio exato (9,8× medido para 10×). Gargalo: SVG do Recharts. Bundle 896 kB (269 kB gzip), aviso de chunk > 500 kB do Vite não tratado.
- Fluxos testados no navegador: Iniciar, Pausar, Continuar, Reiniciar, Avançar 1 passo, velocidade, 5 presets, troca de grandeza, Modo Didático (7 passos, Page Up/Down), validação (τ = 0, texto, α = 1,5, duração 0), tabela, tema.

## Verificação final (F8), 2026-10-29
- `npx vitest run`: 26 passed (26)
- `npx tsc -b`: exit 0
- `npx oxlint`: exit 0, sem avisos
- `npm run build`: ✓ built
- Busca por console.log/TODO/lorem/debugger: nada encontrado
- Console do navegador (build): sem mensagens

## Mudanças de escopo
- (nenhuma)

## Pendências
- [ ] Carlos confirmar a direção visual e decidir se quer `PRODUCT.md`/`DESIGN.md` separados.
- [ ] Opcional: dividir o bundle (code splitting do KaTeX/Recharts) para tirar o aviso de 500 kB.
- [ ] Opcional: deploy (Vercel/Cloudflare Pages) só com ok do Carlos.

## Placeholders ainda no site
- Nenhum.

## Créditos e licenças
- React, Vite, Tailwind CSS, Recharts, KaTeX | npm | MIT
- lucide-react | npm | ISC
- IBM Plex Sans / Mono | Fontsource (self-host) | SIL OFL 1.1
- Paleta das séries | paleta de referência da skill dataviz, validada
