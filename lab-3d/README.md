# IoT Signal Lab 3D

Laboratório 3D interativo: um sensor IoT de temperatura transforma a grandeza física em sinal, o sinal viaja por um canal com latência e ruído, passa por um filtro passa-baixa e chega ao gateway. A Transformada de Laplace aparece em cada etapa.

```
Ambiente x(t) → Sensor H(s) = 1/(τs+1) → Canal e^(−T_d s) → Ruído y_r = y + n → Filtro H_f(s) → Gateway z(t − T_d)
```

Tudo roda no navegador: sem backend, sem banco de dados, sem rastreamento, sem modelos 3D externos (geometria procedural).

## Como rodar

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run build && npm run preview   # recomendado para a aula: http://localhost:4173
npm run dev                         # desenvolvimento: http://localhost:5173
```

Use o build (`preview`) na apresentação: o modo de desenvolvimento do React é bem mais lento. Deixe a aba do navegador **em primeiro plano**: o Chrome desacelera abas em segundo plano para ~1 quadro por segundo, e a simulação anda devagar (não dá saltos).

## Verificação

```bash
npm test          # 26 testes do modelo (Vitest)
npm run typecheck # TypeScript estrito
npm run lint      # oxlint
```

Os testes cobrem os pedidos da spec (63,2% em t = τ; ruído zero ⇒ y_r = y; α = 1 ⇒ z = y_r; mais latência ⇒ chegada mais tarde) e também: a discretização exata coincide com y(t) = 40 − 20e^(−t/5) em toda amostra, degrau no meio do transitório, filtro reduzindo o ruído na razão teórica √(α/(2−α)), pulsos chegando exatamente em t_k + T_d, taxa de perda de pacotes e o roteiro de 8 etapas.

## Uso em sala

| Ação | Como |
|---|---|
| Iniciar / pausar / continuar | botões ou **Espaço** |
| Reiniciar | botão ou **R** |
| Novo degrau durante a simulação | **Aplicar mudança de temperatura** (alterna entre T_f e T_i) |
| Explicação guiada (manual) | **Explicar sistema** · Page Up / Page Down (passador de slides) |
| Explicação automática | **Modo apresentação** (9 s por etapa, a câmera acompanha) |
| Câmera | arrastar gira, roda aproxima, botão direito move; vistas prontas no canto da cena |

Leitura da cena: cada pulso é uma amostra; a **altura** do pulso é o valor. Laranja = y (bruto), verde = y_r (depois do ruído), amarelo = z (filtrado), cinza = pacote perdido. As colunas x(t) (azul) e y(t) (laranja) usam a mesma régua: durante o transitório a diferença entre real e medido fica à vista.

## Modelo

- **Sensor:** τ·y' + y = x(t). Avanço exato por amostra (entrada constante entre amostras): y_k = x + (y_{k−1} − x)·e^(−Δt/τ), idêntico à solução fechada nos instantes t_k.
- **Laplace:** τ[sY(s) − y(0)] + Y(s) = X(s); com y(0) = 0 (desvio em torno do equilíbrio), H(s) = 1/(τs + 1).
- **Ruído do canal:** uniforme em [−A, A] ou gaussiano (Box–Muller) com σ = A/√3; semente fixa.
- **Filtro:** z_k = α·y_{r,k} + (1 − α)·z_{k−1}, discretização de τ_f·z' + z = y_r com α = Δt/(τ_f + Δt).
- **Latência:** cada amostra chega ao gateway em t_k + T_d (Y_delay(s) = e^(−T_d s)·Y(s)). O gateway mostra z(t − T_d).
- **Perda de pacotes (0–20%):** camada de rede, fora do modelo de Laplace. Pacote perdido não chega ao filtro, que mantém a última saída.

## Estrutura

```
src/
  simulation/   engine (pipeline), sensorModel, noiseModel, filterModel,
                transmissionModel (zonas do canal, pool de pulsos), laplaceModel
  store/        simulationStore (zustand + motor fora do React)
  components/
    three/      Scene, Environment, IoTSensor, SignalChannel, NoiseZone,
                LowPassFilter, Gateway, SignalParticles, SignalWave,
                CameraController, Gauge, DeviceScreen, SceneLabel …
    dashboard/  ControlPanel, SimulationControls, MetricsPanel, LaplacePanel,
                TourPanel, SceneHud, Header
    charts/     SignalChart, TransmissionChart
  lib/          presets, validation, tour, chartData, format
tests/          simulation.test.ts
```

## Desempenho medido (build, Chrome, GPU integrada Intel UHD, 1366×768)

- Cena de aula: ~46 fps; com os gráficos visíveis: ~41–46 fps.
- Pior caso (50 Hz × T_d 5 s ≈ 250 pulsos em voo, 4×): ~46 fps, relógio exato (4,0×).
- Pulsos numa única InstancedMesh, pool fixo, nada alocado por quadro; interface atualizada a 10 Hz e gráficos a 4 Hz (congelam fora da tela).

## Publicar (opcional)

Build estático: comando `npm run build`, pasta `dist`. Vercel ou Cloudflare Pages servem sem configuração extra.

## Licenças

React, Vite, Tailwind CSS, Recharts, KaTeX, three.js, React Three Fiber, drei, zustand: MIT. lucide-react: ISC. IBM Plex Sans/Mono: SIL OFL 1.1 (Fontsource, servidas localmente).
