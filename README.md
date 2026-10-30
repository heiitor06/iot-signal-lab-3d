> Este repositório tem três projetos: **Smart Lighting Lab 3D** em [`smart-lighting/`](smart-lighting/), **IoT Signal Lab 3D** em [`lab-3d/`](lab-3d/) (publicado em https://heiitor06.github.io/iot-signal-lab-3d/) e o **IoT Signal Monitor** 2D, descrito abaixo, na raiz.

# IoT Signal Monitor

Simulador interativo que mostra como a **Transformada de Laplace** modela a resposta de um sensor IoT e como um filtro passa-baixa trata o ruído da leitura. Feito para apresentação na disciplina de Equações Diferenciais Ordinárias.

```
Grandeza real x(t) → Sensor H(s) = 1/(τs+1) → Ruído n(t) → Filtro H_f(s) → Leitura z(t)
```

Roda inteiro no navegador: sem backend, sem banco de dados, sem rastreamento.

## Como rodar

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run dev       # desenvolvimento em http://localhost:5173
npm run build     # build de produção em dist/
npm run preview   # serve o build em http://localhost:4173
```

Para a aula, use `npm run build && npm run preview`: o modo de desenvolvimento do React é bem mais lento e a animação perde fluidez.

## Verificação

```bash
npm test          # 26 testes da matemática (Vitest)
npm run typecheck # TypeScript estrito
npm run lint      # oxlint
```

Os testes cobrem os cinco casos obrigatórios: 63,2% em t = τ, sem ruído (y_r = y), α = 1 (z = y_r), ruído alto + filtro forte (o filtrado varia menos, e na proporção teórica √(α/(2−α))) e mudança de τ (H(s) e curva). Também verificam numericamente que a curva gerada satisfaz τ·y' + y = x.

## Uso em sala

| Ação | Como |
|---|---|
| Iniciar / pausar / continuar | botões ou **Espaço** |
| Avançar uma amostra | botão ou **→** |
| Reiniciar | botão ou **R** |
| Modo Didático: próximo / anterior | botões ou **Page Down / Page Up** (passador de slides funciona) |
| Projetor que "lava" o fundo escuro | botão de sol no topo (tema claro) |

O preset **Demonstração em sala** é o padrão: 20 → 40 °C, τ = 5 s, degrau em t₀ = 2 s, 30 s, ruído gaussiano moderado e filtro médio. A semente do ruído é fixa na abertura, então a demonstração sai sempre igual; "Novo ruído" sorteia outra sequência.

## Modelo matemático

- **Sensor:** τ·y' + y = x(t). Solução exata para o degrau: y(t) = T_f + (T_i − T_f)·e^(−(t−t₀)/τ) para t ≥ t₀.
- **Laplace:** com condição inicial nula (em variáveis de desvio), H(s) = Y(s)/X(s) = 1/(τs + 1).
- **Ruído:** uniforme em [−A, A] ou gaussiano (Box–Muller) com σ = A/√3, ou seja, a mesma potência do uniforme.
- **Filtro:** z_k = α·y_k + (1 − α)·z_{k−1}, que é a discretização (Euler implícito) de τ_f·z' + z = y_r com α = Δt/(τ_f + Δt).
- **Métricas:** e(t) = |x − z|, MAE = (1/N)·Σ|x_k − z_k|, t_s ≈ 4τ. A redução de ruído mostrada no card do filtrado compara o desvio de y_r − y com o de z − LPF(y), separando o ruído do atraso que o filtro introduz.

## Estrutura

```
src/
  components/   Header, SystemFlow, SimulationControls, SignalChart, SignalTable,
                MetricsCards, ControlPanel, PresetSelector, LaplacePanel,
                TauExplanation, DidacticMode, Tex, ui/
  hooks/        useSimulationPlayer (relógio), useTheme, useKeyboardShortcuts
  lib/          simulation, noise, filters, laplace, metrics, presets,
                sensors, validation, didactic, chart, format, series
  types/        simulation.ts
tests/          simulation.test.ts
```

## Outros sensores

Os valores do modelo são genéricos (`initialValue`, `finalValue`). Para um sensor novo, acrescente um perfil em `src/lib/sensors.ts` (unidade, faixas, níveis de ruído e valores padrão). Já existem temperatura, umidade, pressão e luminosidade, selecionáveis no topo da página.

## Publicar (opcional)

O build é estático. Em Vercel ou Cloudflare Pages: comando de build `npm run build`, pasta de saída `dist`. Nenhuma variável de ambiente é necessária.

## Licenças

- React, Vite, Tailwind CSS, Recharts, KaTeX, lucide-react: MIT (lucide: ISC).
- Fontes IBM Plex Sans e IBM Plex Mono: SIL Open Font License, servidas localmente via Fontsource.
