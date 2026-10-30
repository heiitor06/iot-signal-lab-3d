# Smart Lighting Lab 3D

**Online:** https://heiitor06.github.io/iot-signal-lab-3d/smart-lighting/ (publicado pelo GitHub Actions a cada push na `master`, junto com o lab-3d; ver `.github/workflows/deploy-pages.yml`).

Laboratório virtual 3D de controle de iluminação para a disciplina de Equações Diferenciais Ordinárias. Uma sala com janela, mesa, sensor de luminosidade, controlador e lâmpada inteligente funciona em tempo real: a luz natural muda, o sensor mede, o controlador decide e a lâmpada responde, e gráficos, equações e diagrama de blocos acompanham.

```
L_ref → Σ → e(t) → K_p → u(t) → H(s) = K/(τs+1) → y(t) → Σ (+ L_ext) → L(t)
         ↑ −                                                            │
         └──────────────────── sensor: L(t) medido ─────────────────────┘
```

Tudo roda no navegador: sem backend, sem rastreamento, sem modelos 3D externos (geometria procedural).

## Como rodar

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run build && npm run preview   # recomendado para a aula: http://localhost:4173
npm run dev                         # desenvolvimento: http://localhost:5173
```

Use o build (`preview`) na apresentação: o modo de desenvolvimento do React é bem mais lento. Deixe a aba **em primeiro plano** (o Chrome desacelera abas de fundo). Em tela cheia (F11) a sala fica maior.

## Verificação

```bash
npm test          # 26 testes do modelo (Vitest)
npm run typecheck # TypeScript estrito
npm run lint      # oxlint
```

Os testes cobrem os 7 casos da spec (L_ext = L_ref ⇒ potência → 0; menos luz externa ⇒ lâmpada sobe; mais ⇒ desce; τ maior ⇒ mais lento; K_p muda a resposta; manual ignora o controlador; H(s) acompanha K e τ) e também: a simulação reproduz y(t) = K·U₀(1 − e^(−t/τ)) em toda amostra; marcos 63,2/95/99,3%; Euler vs. forma exata; equilíbrio = T(0)·L_ref + S(0)·L_ext; malha fechada de 1ª ordem com τ_mf = τ/(1 + K·K_p); estabilidade do laço no pior caso das faixas; perturbações e energia.

## Uso em sala

| Ação | Como |
|---|---|
| Apresentação automática (10 etapas, 9 s cada) | **INICIAR APRESENTAÇÃO** |
| Mesmo roteiro, avançando à mão | **Passo a passo**, ou **Page Down / Page Up** (passador de slides funciona) |
| Iniciar / pausar / continuar | botões ou **Espaço** |
| Reiniciar | botão ou **R** |
| Perturbações | **Nuvem passando**, **Sol intenso**, **Anoitecer** |
| Câmera | Visão geral, Sensor, Lâmpada, Controlador, Diagrama (ou arraste/role) |

Roteiro sugerido além da apresentação: *Nuvem passando* (lâmpada sobe e volta) → *Sol intenso* (lâmpada apaga, L passa de L_ref) → modo **Manual** com u = 80% (resposta de malha aberta com marcos τ, 3τ, 5τ no gráfico) → τ = 6 s e τ = 0,5 s (resposta lenta × rápida). **Voltar ao padrão** restaura os valores a qualquer momento.

## Modelo matemático

- **Planta (lâmpada + ambiente):** τ·y′ + y = K·u(t), u em % (0–100), K em lux/%. Com y(0) = 0, Laplace dá H(s) = Y(s)/U(s) = K/(τs + 1).
- **Luminosidade medida:** L(t) = L_ext(t) + y(t).
- **Controlador P:** e = L_ref − L, u = K_p·e, saturado em 0 ≤ u ≤ 100%. Troca para manual sem tranco (a lâmpada fica na potência atual).
- **Malha fechada:** T(s) = K_p·K/(τs + 1 + K_p·K); a luz externa passa por S(s) = (τs + 1)/(τs + 1 + K_p·K). Erro em regime e_ss = (L_ref − L_ext)/(1 + K·K_p): o controlador P sempre deixa um erro residual.
- **Integração:** laço discreto com Δt = 10 ms, na ordem da spec (L_ext → L → e → u → saturação → EDO). A EDO é integrada pela forma exata para u constante no passo, y_{k+1} = K·u_k + (y_k − K·u_k)·e^(−Δt/τ), que coincide com Euler em 1ª ordem e reproduz a solução analítica sem erro acumulado. O laço é estável enquanto (1 − e^(−Δt/τ))(1 + K·K_p) < 2; as faixas aceitas garantem isso.
- **Energia:** P(t) = P_max·u/100; economia comparada com a lâmpada a 100% o tempo todo.

Padrão (botão **Voltar ao padrão**, `lib/defaults.ts`): L_ref = 500 lux, L_ext = 200 lux, τ = 2 s, K = 8 lux/%, K_p = 2 %/lux, P_max = 20 W. Em regime: e = 17,6 lux, u = 35%, L = 482 lux.

## Estrutura

```
src/
  simulation/   lightingModel, controller, disturbances, laplaceModel, metrics, engine (sem React)
  store/        simulationStore (zustand; motor fora do React, retrato a 10 Hz)
  components/
    three/      Scene, SmartRoom, Window, SunLight, SmartLamp, LightSensor, ControllerBox,
                ControlWiring, LuxIndicator, DiagramMonitor, StationMarker, CameraController
    dashboard/  Header, SimulationControls, ControlPanel, SceneHud, TourPanel, MetricsPanel,
                BlockDiagram, LaplacePanel, ClosedLoopPanel
    charts/     LuxChart, ControlChart, StepResponseChart
  lib/          defaults, tour, validation, chartData, format
tests/          simulation.test.ts
```

## Publicar (opcional)

Build estático (`base: './'`): `npm run build`, pasta `dist`. Funciona em GitHub Pages, Vercel ou Cloudflare Pages sem variáveis de ambiente.

## Licenças

- three.js, React Three Fiber, drei, zustand, React, Vite, Tailwind CSS, Recharts, KaTeX: MIT. lucide-react: ISC.
- IBM Plex Sans e IBM Plex Mono: SIL Open Font License, servidas localmente via Fontsource.
