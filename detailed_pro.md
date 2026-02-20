# Khalid's Strategy Grinder — Detailed Workflow Report

> **"Destroy the strategy with tests. If it survives, allocate small capital."**

*Report generated: February 18, 2026*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technology Stack & Dependencies](#3-technology-stack--dependencies)
4. [Multi-LLM Orchestration Layer](#4-multi-llm-orchestration-layer)
5. [The 7-Stage Pipeline — Deep Dive](#5-the-7-stage-pipeline--deep-dive)
   - [Stage 1: Hypothesis Generation](#stage-1-hypothesis-generation)
   - [Stage 2: Implementation](#stage-2-implementation)
   - [Stage 3: Sanity Check (Kill Gate)](#stage-3-sanity-check-kill-gate)
   - [Stage 4: The Interrogation](#stage-4-the-interrogation)
   - [Stage 5: Stress Test (Kill Gate)](#stage-5-stress-test-kill-gate)
   - [Stage 6: Walk-Forward Validation (Kill Gate)](#stage-6-walk-forward-validation-kill-gate)
   - [Stage 7: Deploy Tiny](#stage-7-deploy-tiny)
6. [Strategy Lifecycle & Data Flow](#6-strategy-lifecycle--data-flow)
7. [Prompt Engineering Design](#7-prompt-engineering-design)
8. [Kill Gate Framework](#8-kill-gate-framework)
9. [Configuration System](#9-configuration-system)
10. [Manifest & Audit Trail System](#10-manifest--audit-trail-system)
11. [File & Directory Architecture](#11-file--directory-architecture)
12. [CLI Interface & Usage](#12-cli-interface--usage)
13. [Strengths & Design Decisions](#13-strengths--design-decisions)
14. [Potential Improvements & Recommendations](#14-potential-improvements--recommendations)
15. [Appendix: Full Stage Summary Table](#15-appendix-full-stage-summary-table)

---

## 1. Executive Summary

**Khalid's Strategy Grinder** is a fully automated, 7-stage AI-powered pipeline designed to generate, implement, test, and deploy quantitative trading strategies. The system embodies the **scientific method applied to trading** — instead of optimizing strategies until they look profitable (curve fitting), the pipeline ruthlessly kills weak strategies across multiple independent validation stages. Only strategies that survive all kill gates are promoted for live paper trading.

### Core Philosophy

| Approach | Method | Risk |
|----------|--------|------|
| **Old Workflow** | Optimize until profitable | Curve fitting, overfitting |
| **This Workflow** | Kill until only real edges survive | Anti-fragile, scientific |

### Key Metrics

- **Input**: 10–50 AI-generated strategy hypotheses per batch
- **Expected Survival Rate**: 2–4% of ideas make it to live trading
- **Kill Gates**: 3 automated, 1 human-assisted
- **LLM Providers**: 4 (OpenAI, DeepSeek, Anthropic, Google)
- **Stress Scenarios**: 5 per strategy

---

## 2. System Architecture Overview

The system follows a **sequential pipeline architecture** where strategies flow through 7 stages. At each kill gate, failing strategies are permanently moved to a **graveyard** (`/killed`), while survivors advance to the next stage. The pipeline is orchestrated by a central CLI entry point (`grind.py`) that coordinates all stages.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        grind.py (CLI Orchestrator)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│   │ Stage 1  │───▶│ Stage 2  │───▶│ Stage 3  │───▶│ Stage 4  │     │
│   │Hypothesis│    │Implement │    │ Sanity ☠ │    │Interrogate│    │
│   │(LLM)     │    │(LLM)     │    │(Python)  │    │(LLM)      │    │
│   └──────────┘    └──────────┘    └────┬─────┘    └────┬──────┘    │
│                                        │               │           │
│                                    ┌───▼───┐       ┌───▼───┐      │
│                                    │/killed│       │Human  │      │
│                                    │       │       │Review │      │
│                                    └───────┘       └───┬───┘      │
│                                                        │           │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐        │           │
│   │ Stage 7  │◀───│ Stage 6  │◀───│ Stage 5  │◀───────┘           │
│   │ Deploy   │    │Walk-Fwd ☠│    │ Stress ☠ │                    │
│   │          │    │(Python)  │    │(Python+LLM)│                   │
│   └────┬─────┘    └────┬─────┘    └────┬──────┘                   │
│        │               │               │                           │
│    ┌───▼───┐       ┌───▼───┐       ┌───▼───┐                     │
│    │ /live │       │/killed│       │/killed│                     │
│    └───────┘       └───────┘       └───────┘                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  pipeline/llm.py     pipeline/manifest.py     config.yaml          │
│  (Multi-LLM Router)  (Audit Trail System)     (Thresholds/Keys)    │
└─────────────────────────────────────────────────────────────────────┘
```

☠ = Automated Kill Gate

---

## 3. Technology Stack & Dependencies

### Core Dependencies (`requirements.txt`)

| Package | Purpose |
|---------|---------|
| `pyyaml` | Configuration and manifest file parsing |
| `rich` | Beautiful terminal output with tables, panels, and colors |
| `requests` | HTTP client for LLM API calls |
| `pandas` | Data manipulation and time series analysis |
| `numpy` | Numerical computation for stress testing |
| `yfinance` | Market data download (OHLCV) |

### Language & Runtime

- **Language**: Python 3
- **Runtime**: Standard CPython
- **Package Manager**: pip with venv

---

## 4. Multi-LLM Orchestration Layer

The `pipeline/llm.py` module implements a **unified router** that auto-detects the correct API provider based on model name. This allows the pipeline to seamlessly use different LLMs for different stages based on their strengths.

### Provider Detection Logic

```
Model Name Contains → Provider → API Endpoint
─────────────────────────────────────────────────────
"deepseek"          → DeepSeek  → api.deepseek.com/v1/chat/completions
"claude"            → Anthropic → api.anthropic.com/v1/messages
"gpt"/"o1"/"o3"/"o4"→ OpenAI   → api.openai.com/v1/chat/completions
"gemini"            → Google    → generativelanguage.googleapis.com/v1beta
```

### Model Assignments (Current Configuration)

| Stage | Task | Configured Model | Rationale |
|-------|------|-------------------|-----------|
| 1 — Hypothesis | Idea generation | `o3-2025-04-16` | Strong reasoning for creative, economically grounded ideas |
| 2 — Implementation | Code writing | `o3-2025-04-16` | Reliable code generation (was `claude-opus-4-6`) |
| 4 — Interrogation | Adversarial critique | `deepseek-reasoner` | Deep reasoning capabilities for finding subtle flaws |
| 5 — Stress (LLM part) | Regime analysis | `gemini-3-flash-preview` | Large context window for analyzing stress results |

### API-Specific Features

- **OpenAI**: Dual endpoint support (`/v1/chat/completions` for o3/o1, `/v1/responses` for GPT-5/Codex), exponential backoff retry with up to 5 retries for rate limiting (429 errors)
- **DeepSeek**: Dynamic `max_tokens` (8192 for `deepseek-chat`, 16000 for `deepseek-reasoner`), temperature disabled for reasoning models
- **Anthropic**: Native `system` prompt support, Anthropic API versioning (`2023-06-01`)
- **Google**: Direct Gemini REST API via `generateContent` endpoint
- **Timeout**: 180s for DeepSeek/Anthropic/Google, 300s for OpenAI (reasoning models take longer)

### `call_llm()` — The Universal Router

```python
call_llm(config, prompt, model, system="")
```

This function is the single entry point for all LLM calls. It:
1. Detects the provider from the model name
2. Handles system prompt injection (prepends for non-Anthropic APIs)
3. Routes to the correct provider-specific function
4. Returns raw text response

---

## 5. The 7-Stage Pipeline — Deep Dive

### Stage 1: Hypothesis Generation

**File**: `pipeline/stage1_hypothesis.py`
**Model**: Configurable (currently `o3-2025-04-16`)
**Kill Gate**: No
**Output**: One folder per idea in `strategies/hypotheses/` with `manifest.yaml`

#### What It Does

1. Loads the `prompts/hypothesis.txt` template, injecting the number of ideas to generate
2. Calls the configured LLM with the prompt
3. Parses the JSON array response (with robust error handling, including recovery from malformed JSON)
4. Creates a uniquely named folder per strategy idea (e.g., `001_momentum_treasury_spread`)
5. Initializes a `manifest.yaml` for each strategy with full metadata

#### Prompt Design

The hypothesis prompt is carefully constrained:
- Restricts to a **pre-approved universe** of liquid ETFs and instruments (SPY, QQQ, TLT, GLD, etc.)
- Requires **economic logic** (why does this edge exist?) — not just pattern matching
- Demands identification of the **counterparty** (who is losing money?)
- Requires explanation of **edge persistence** (why hasn't it been arbitraged away?)
- Enforces **diversity** across asset classes, timeframes, and strategy types

#### JSON Parsing Resilience

The `parse_ideas()` function handles:
- DeepSeek `<think>...</think>` reasoning block removal
- Markdown code fence stripping
- Smart/curly quote replacement
- Control character cleanup
- Trailing comma removal
- **Object-by-object recovery** if full array parsing fails (extracts valid `{...}` blocks individually)
- Saves raw response to `strategies/last_raw_response.txt` for debugging on total failure

---

### Stage 2: Implementation

**File**: `pipeline/stage2_implement.py`
**Model**: Configurable (currently `o3-2025-04-16`)
**Kill Gate**: No
**Output**: `backtest.py` file added to each strategy folder

#### What It Does

1. Iterates through all hypotheses in `strategies/hypotheses/`
2. Skips strategies that already have a `backtest.py` (idempotent)
3. Loads the hypothesis metadata from the manifest
4. Populates the `prompts/implement.txt` template with strategy-specific details
5. Calls the LLM with a system prompt enforcing "quantitative Python developer" behavior
6. Cleans the output (strips markdown fences, `<think>` tags)
7. Writes the backtest code to `backtest.py` in the strategy folder
8. Updates the manifest with implementation metadata (model used, line count)

#### Critical Implementation Constraints (from prompt)

The implementation prompt enforces strict rules on the generated backtest code:

- **Function signature**: `run_backtest(df: pd.DataFrame) -> dict`
- **Input**: DataFrame with only `Open, High, Low, Close, Volume` columns (single ticker)
- **Secondary data**: Must be downloaded within the function using `yfinance`
- **Libraries**: Only `pandas`, `numpy`, `yfinance` allowed
- **Transaction costs**: 10 bps (0.001) per trade
- **No look-ahead bias**: Strict prohibition
- **No optimization**: Translate the hypothesis exactly — no tweaking or extra conditions
- **Return format**: Dict with `sharpe`, `total_return`, `max_drawdown`, `num_trades`, `win_rate`, `avg_trade_return`, `equity_curve`, `trades`

---

### Stage 3: Sanity Check (Kill Gate)

**File**: `pipeline/stage3_sanity.py`
**Model**: Python only (no LLM)
**Kill Gate**: **YES — Automated**
**Output**: Results in manifest; failures moved to `/killed`, survivors promoted to `/survivors`

#### What It Does

1. Iterates through hypotheses that have a `backtest.py`
2. Downloads OHLCV data for each strategy's ticker via `yfinance` (with caching)
3. **Dynamically imports** each strategy's `backtest.py` using `importlib`
4. Executes `run_backtest(df)` and collects results
5. Applies the kill gate criteria
6. Saves equity curves as CSV if available
7. Survivors are **physically moved** from `strategies/hypotheses/` to `strategies/survivors/`
8. Killed strategies are moved to `strategies/killed/` with kill reason recorded

#### Kill Criteria

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Sharpe Ratio < `min_sharpe` | 0.5 (default) | **KILL** |
| Number of Trades < `min_trades` | 25 (default) | **KILL** |
| Runtime error in backtest | Any exception | **KILL** |
| Data download failure | Any error | **KILL** |

#### Data Handling

- Per-strategy ticker support (each strategy can trade a different instrument)
- Session-level data caching to avoid redundant downloads
- Automatic `MultiIndex` column flattening for `yfinance` compatibility

---

### Stage 4: The Interrogation

**File**: `pipeline/stage4_interrogation.py`
**Model**: Configurable (currently `deepseek-reasoner`)
**Kill Gate**: **Human-assisted** (LLM recommends, human decides)
**Output**: `critique.md` per strategy; manifest updated with verdict

#### What It Does

1. Iterates through survivors in `strategies/survivors/`
2. Reads the `backtest.py` source code
3. Populates the interrogation prompt with the hypothesis, code, and Stage 3 results
4. Sends to the configured adversarial reasoning model
5. Parses the verdict from the response (`KILL`, `SUSPECT`, or `PASS`)
6. Saves the full critique to `critique.md`
7. For `KILL` verdicts: prompts the human for confirmation (`y/n/skip`)
8. For `SUSPECT` verdicts: flags for human review but proceeds

#### Adversarial Investigation Areas

The interrogation prompt specifically checks for:

1. **Look-ahead bias** — Does the code access future data?
2. **Survivorship bias** — Does the strategy assume the asset survives the entire period?
3. **Overfitting** — Too many parameters relative to trade count? Suspiciously tuned thresholds?
4. **Transaction cost reality** — Would slippage destroy the edge?
5. **Capacity** — How much capital before market impact?
6. **Regime dependence** — Bull-only? Low-vol only? Trending-only?
7. **Data snooping** — Is the choice of indicator/timeframe itself a form of overfitting?

Each issue is rated: **CRITICAL** (kills), **WARNING** (degrades confidence), or **NOTE** (minor concern).

---

### Stage 5: Stress Test (Kill Gate)

**File**: `pipeline/stage5_stress.py`
**Model**: Python computation + LLM analysis (currently `gemini-3-flash-preview`)
**Kill Gate**: **YES — Automated**
**Output**: Stress results in manifest; `stress_analysis.md` per survivor; failures moved to `/killed`

#### What It Does

1. Iterates through survivors
2. Downloads fresh market data
3. Runs the backtest across **5 hostile stress scenarios** (see below)
4. Applies the kill gate: if worst drawdown falls below the threshold, kill the strategy
5. For survivors, sends results to an LLM for **regime analysis** (optional)
6. Saves the LLM analysis as `stress_analysis.md`

#### Stress Scenarios

| Scenario | Method | Purpose |
|----------|--------|---------|
| **Triple Volatility** | Multiplies daily return deviations by 3× while preserving mean | Tests behavior in extreme volatility |
| **Remove Best Month** | Deletes the single best-performing calendar month | Tests if performance depends on one outlier |
| **Crash Injection** | Inserts a 35% crash over 5 days at a random point | Tests recovery and drawdown resilience |
| **Time Shift (6mo)** | Circular shift of the dataset by 6 months | Tests temporal robustness |
| **Correlation Breakdown** | Randomly shuffles 20% of daily returns | Tests if the strategy relies on specific return correlations |

#### Kill Criteria

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Worst drawdown across all scenarios < `max_stress_drawdown` | -50% (default) | **KILL** |
| Runtime error during stress test | Any exception | **KILL** |

#### LLM Analysis (Post-Survival)

The stress prompt asks the LLM to:
1. Identify which regimes break the strategy and why
2. Describe the worst realistic scenario
3. Assess regime dependency vs. robustness
4. Predict what future market event could destroy it
5. Estimate probability of surviving the next 5 years
6. Issue a verdict: **FRAGILE**, **SENSITIVE**, or **ROBUST**

---

### Stage 6: Walk-Forward Validation (Kill Gate)

**File**: `pipeline/stage6_walkforward.py`
**Model**: Python only (no LLM)
**Kill Gate**: **YES — Automated**
**Output**: In-sample vs out-of-sample comparison in manifest; failures moved to `/killed`

#### What It Does

1. Splits the data at a configurable date (default: 2025-01-01)
   - **Training period**: 2020-01-01 → 2025-01-01 (5 years)
   - **Test period**: 2025-01-01 → 2026-01-01 (1 year)
2. Runs the backtest on both periods independently
3. Calculates **Sharpe decay**: `1 - (out_sample_sharpe / in_sample_sharpe)`
4. Displays a comparison table (Sharpe, Return, Max DD, Trades)
5. Applies the kill gate

#### Kill Criteria

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Sharpe decay > `max_performance_decay` | 50% (default) | **KILL** |
| Out-of-sample Sharpe ≤ 0 | Any | **KILL** |
| Insufficient data (train < 100, test < 20 bars) | — | **KILL** |

This is the **most important kill gate** in the pipeline. A strategy that looks good in backtesting but decays significantly out-of-sample is almost certainly overfit and should not be traded with real capital.

---

### Stage 7: Deploy Tiny

**File**: `pipeline/stage7_deploy.py`
**Model**: None (report generation + human confirmation)
**Kill Gate**: No
**Output**: `deploy_report.md` with full audit trail; strategies promoted to `/live`

#### What It Does

1. Iterates through survivors
2. Generates a comprehensive **deploy report** (`deploy_report.md`) containing:
   - Full strategy hypothesis and economic logic
   - Stage 3 sanity check results (Sharpe, return, drawdown, trades, win rate)
   - Stage 4 adversarial critique verdict
   - Stage 5 stress test results (per-scenario table)
   - Stage 6 walk-forward comparison
   - Deployment checklist
3. Displays a summary panel with key metrics
4. Prompts the user for final confirmation to promote to `/live`
5. Physically moves the strategy folder to `strategies/live/`

#### Deployment Checklist (in Generated Report)

- [ ] Paper trade for minimum 2 weeks
- [ ] Compare live fills vs backtest assumptions
- [ ] Set position size to MINIMUM meaningful amount
- [ ] Configure monitoring alerts (drawdown, Sharpe drift)
- [ ] Scale up ONLY after 1 month of live ≈ backtest performance
- [ ] Set hard stop: if live Sharpe drops below 0.5, pause and review

---

## 6. Strategy Lifecycle & Data Flow

Each strategy follows this lifecycle, tracked by the manifest system:

```
 BORN                    TESTED                    DEPLOYED
  │                        │                          │
  ▼                        ▼                          ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│hypothesis│─▶│hypotheses│─▶│survivors │─▶│  live    │
│generated │  │+backtest │  │+critique │  │+report   │
│          │  │          │  │+stress   │  │          │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘
     │             │             │
     └──────┬──────┘─────────────┘
            ▼
     ┌──────────┐
     │  killed  │   ← The graveyard (majority end up here)
     │+reason   │
     │+stage    │
     └──────────┘
```

### Files Accumulated Per Strategy

| Stage | Files Created |
|-------|--------------|
| Stage 1 | `manifest.yaml` |
| Stage 2 | `backtest.py` |
| Stage 3 | `equity_curve.csv` |
| Stage 4 | `critique.md` |
| Stage 5 | `stress_analysis.md` |
| Stage 7 | `deploy_report.md` |

---

## 7. Prompt Engineering Design

The prompt system uses **template files** in the `prompts/` directory with placeholder substitution. Each prompt is carefully designed for its specific LLM and task.

### Design Principles

1. **Role Assignment**: Each prompt assigns a specific expert role (e.g., "ruthless adversarial code reviewer at a quantitative hedge fund")
2. **Constrained Output**: Prompts specify exact output formats (JSON arrays, Python code only, specific verdict labels)
3. **Domain Specificity**: Prompts include domain-specific constraints (approved ticker universe, backtest function signature, specific biases to check)
4. **Anti-Gaming**: The interrogation prompt is specifically designed to be adversarial — "You are paid to kill bad strategies, not to be polite"

### Prompt Files

| File | Stage | Tokens (approx.) | Key Constraints |
|------|-------|-------------------|-----------------|
| `hypothesis.txt` | 1 | ~400 | Restricted ticker universe, JSON output, economic logic required |
| `implement.txt` | 2 | ~600 | Exact function signature, no external dependencies, 10bps costs |
| `interrogate.txt` | 4 | ~300 | 7 specific bias checks, severity ratings, final verdict |
| `stress.txt` | 5 | ~200 | 6 regime analyses, probability estimates, final verdict |

---

## 8. Kill Gate Framework

The kill gate system is the backbone of the pipeline's scientific approach. Three stages have automated kill gates, and one has a human-assisted gate.

### Kill Gate Summary

| Stage | Type | Criteria | Configurable? |
|-------|------|----------|---------------|
| **Stage 3** | Automated | Sharpe < 0.5, Trades < 25 | Yes (`config.yaml`) |
| **Stage 4** | Human-assisted | LLM verdict + human confirmation | No |
| **Stage 5** | Automated | Worst stress drawdown < -50% | Yes (`config.yaml`) |
| **Stage 6** | Automated | Sharpe decay > 50%, OOS Sharpe ≤ 0 | Yes (`config.yaml`) |

### What Happens When a Strategy Is Killed

1. Manifest is updated with `status: KILLED`, kill reason, kill stage, and timestamp
2. Strategy folder is physically moved from its current directory to `strategies/killed/`
3. Full audit trail is preserved — you can always inspect why a strategy was killed

### Kill Rate Expectations

```
Stage 1: 10-50 ideas generated
  └─ Stage 3: ~60-80% killed (bad Sharpe, too few trades, runtime errors)
     └─ Stage 4: ~10-20% killed (look-ahead bias, overfitting)
        └─ Stage 5: ~30-50% killed (fragile under stress)
           └─ Stage 6: ~40-60% killed (overfit — decays out-of-sample)
              └─ Stage 7: 1-2 survivors deployed (~2-4% survival rate)
```

---

## 9. Configuration System

All configurable parameters live in `config.yaml`, organized into four sections.

### API Keys

```yaml
api_keys:
  deepseek: "sk-..."
  anthropic: "sk-..."
  openai: "sk-proj-..."
  google: "AIza..."
```

### Model Selection

```yaml
models:
  hypothesis: "o3-2025-04-16"          # Stage 1
  implement: "o3-2025-04-16"           # Stage 2
  interrogate: "deepseek-reasoner"     # Stage 4
  stress: "gemini-3-flash-preview"     # Stage 5
```

This makes it trivial to swap models — e.g., switching from `o3` to `claude-opus-4-6` for implementation requires changing a single line.

### Pipeline Settings

```yaml
pipeline:
  num_ideas: 10                 # Ideas per batch
  data_ticker: "SPY"            # Default ticker
  data_start: "2020-01-01"      # Training start
  data_split: "2025-01-01"      # Walk-forward split
  data_end: "2026-01-01"        # Data end
```

### Kill Thresholds

```yaml
kill_gates:
  min_sharpe: 0.5               # Stage 3
  min_trades: 25                # Stage 3
  max_stress_drawdown: -0.50    # Stage 5
  max_performance_decay: 0.50   # Stage 6
```

---

## 10. Manifest & Audit Trail System

The `pipeline/manifest.py` module provides a complete audit trail system. Every stage's results are accumulated in a YAML manifest file that travels with the strategy through the pipeline.

### Manifest Structure

```yaml
id: "003_momentum_treasury_spread"
created: "2026-02-18T15:30:00"
status: "hypothesis"          # or "KILLED"
current_stage: 1
stages:
  stage1_hypothesis:
    timestamp: "..."
    idea: "..."
    ticker: "SPY"
    economic_logic: "..."
    ...
  stage3_sanity:
    timestamp: "..."
    sharpe: 1.234
    total_return: 0.35
    ...
  # ... stages accumulate as the strategy progresses
kill_reason: "..."            # Only if killed
kill_stage: "..."             # Only if killed
killed_at: "..."              # Only if killed
```

### Key Operations

| Function | Purpose |
|----------|---------|
| `create_manifest()` | Initialize a new strategy manifest (Stage 1) |
| `load_manifest()` | Read manifest from a strategy directory |
| `save_manifest()` | Write manifest to a strategy directory |
| `update_stage()` | Add/update a stage's results in the manifest |
| `kill_strategy()` | Mark as killed, record reason, move to `/killed` |
| `promote_strategy()` | Move strategy folder to the next pipeline directory |
| `list_strategies()` | List all strategy folders in a directory (filters for `manifest.yaml` existence) |

---

## 11. File & Directory Architecture

```
WorkFlowEngine/
├── grind.py                      # Main CLI entry point (166 lines)
├── config.yaml                   # API keys + kill thresholds (40 lines)
├── requirements.txt              # Python dependencies
├── .gitignore
├── detailed_pro.md               # This report
│
├── pipeline/                     # Core engine
│   ├── __init__.py              # Package init (unused in imports)
│   ├── llm.py                   # Multi-LLM router (231 lines)
│   ├── manifest.py              # Audit trail system (105 lines)
│   ├── stage1_hypothesis.py     # Idea generation (148 lines)
│   ├── stage2_implement.py      # Backtest code writing (111 lines)
│   ├── stage3_sanity.py         # Sanity kill gate (177 lines)
│   ├── stage4_interrogation.py  # Adversarial critique (140 lines)
│   ├── stage5_stress.py         # Stress kill gate (278 lines)
│   ├── stage6_walkforward.py    # Walk-forward kill gate (205 lines)
│   └── stage7_deploy.py         # Deployment report (177 lines)
│
├── prompts/                      # LLM prompt templates
│   ├── hypothesis.txt           # Stage 1 prompt
│   ├── implement.txt            # Stage 2 prompt
│   ├── interrogate.txt          # Stage 4 prompt
│   └── stress.txt               # Stage 5 prompt
│
└── strategies/                   # Data directories
    ├── hypotheses/              # Stage 1 output (raw ideas)
    ├── killed/                  # Graveyard (with kill reasons)
    ├── survivors/               # Passed stages 3–6
    ├── live/                    # Deployed for paper trading
    └── last_raw_response.txt    # Debug: last LLM response
```

### Total Codebase Size

| Component | Files | Lines |
|-----------|-------|-------|
| Pipeline modules | 9 | ~1,572 |
| Prompt templates | 4 | ~176 |
| CLI + config | 2 | ~206 |
| **Total** | **15** | **~1,954** |

---

## 12. CLI Interface & Usage

The CLI is built with `argparse` and uses the `rich` library for beautiful terminal output with colored text, tables, and panels.

### Commands

```bash
# Run the full pipeline (all 7 stages sequentially)
python grind.py

# Run a specific stage
python grind.py --stage 1    # Generate hypotheses
python grind.py --stage 2    # Implement backtests
python grind.py --stage 3    # Sanity check (kill gate)
python grind.py --stage 4    # Adversarial interrogation
python grind.py --stage 5    # Stress test (kill gate)
python grind.py --stage 6    # Walk-forward (kill gate)
python grind.py --stage 7    # Deploy report

# Check pipeline status
python grind.py --status

# Reset pipeline (move everything back to hypotheses)
python grind.py --reset
```

### Status Display

The `--status` command shows a rich table with:
- Count of strategies in each directory (hypotheses, killed, survivors, live)
- Strategy names in each directory
- Kill log (last 10 killed strategies with reasons and stages)

### Reset Functionality

The `--reset` command moves ALL strategies (from killed, survivors, and live) back to `hypotheses/`, with user confirmation required. This allows re-running the pipeline from scratch.

---

## 13. Strengths & Design Decisions

### What This System Does Well

1. **Anti-Fragile Philosophy**: The kill-first approach prevents overfitting — the most dangerous trap in quantitative trading
2. **Multi-LLM Diversity**: Using different models for different stages reduces the risk of systematic LLM bias
3. **Complete Audit Trail**: Every decision, kill, and result is recorded in the manifest
4. **Physical Separation**: Strategies are physically moved between directories, making state visible in the filesystem
5. **Modular Architecture**: Each stage is an independent module that can be run, debugged, or replaced independently
6. **Robust JSON Parsing**: The object-by-object recovery in Stage 1 handles the inherent unreliability of LLM-generated JSON
7. **Idempotent Stages**: Stage 2 skips strategies that already have `backtest.py`, allowing safe re-runs
8. **Configurable Thresholds**: All kill criteria are externalized to `config.yaml`
9. **Human-in-the-Loop**: Stage 4 (Interrogation) and Stage 7 (Deploy) require human confirmation for critical decisions
10. **Data Caching**: Stage 3 caches downloaded data to avoid redundant API calls

### Design Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Sequential pipeline | Simple and debuggable, but can't parallelize stages |
| Physical file movement | Clear state management, but makes it harder to re-process killed strategies |
| Dynamic module import | Flexible backtest execution, but requires careful sandboxing |
| Template-based prompts | Easy to customize, but limited dynamic context injection |

---

## 14. Potential Improvements & Recommendations

### High Priority

1. **Sandboxing for Stage 3**: Dynamically importing and executing LLM-generated code (`backtest.py`) is a security risk. Consider running backtests in a subprocess or container.
2. **Parallel Execution**: Stages 2, 3, and 5 could process multiple strategies concurrently (e.g., with `asyncio` or `multiprocessing`) to significantly reduce pipeline runtime.
3. **Error Recovery**: If a stage fails mid-way (e.g., API timeout), there's no automatic retry or resumption mechanism for the full stage.
4. **Data Provider Abstraction**: `yfinance` is tightly coupled throughout. Consider abstracting the data layer to support alternative providers.

### Medium Priority

5. **Strategy Versioning**: Once a strategy is killed, its folder is moved. Consider keeping a reference or link in the original location for traceability.
6. **Logging System**: Replace `console.print` with structured logging (e.g., `logging` module) for production use, while keeping Rich output for interactive use.
7. **Cost Tracking**: Track cumulative LLM API costs per pipeline run (each provider returns usage metadata).
8. **Database Backend**: Replace filesystem-based state management with a lightweight database (e.g., SQLite) for better querying and reporting.

### Low Priority

9. **Web Dashboard**: Build a dashboard to visualize pipeline status, kill rates, strategy comparisons, and equity curves.
10. **Strategy Comparison**: Add a module that compares surviving strategies for correlation — avoid deploying multiple strategies that bet on the same market dynamic.
11. **Continuous Integration**: Schedule pipeline runs on a cron job with fresh hypothesis batches and automated notifications.

---

## 15. Appendix: Full Stage Summary Table

| Stage | Name | File | Model | Kill Gate | Input | Output | Key Metric |
|-------|------|------|-------|-----------|-------|--------|------------|
| 1 | Hypothesis | `stage1_hypothesis.py` | o3 | No | Prompt template | `manifest.yaml` per idea | N ideas generated |
| 2 | Implementation | `stage2_implement.py` | o3 | No | Hypothesis manifest | `backtest.py` | Lines of code |
| 3 | Sanity Check | `stage3_sanity.py` | Python | **Yes** | `backtest.py` + market data | Manifest update + `equity_curve.csv` | Sharpe ≥ 0.5, ≥ 25 trades |
| 4 | Interrogation | `stage4_interrogation.py` | DeepSeek | Human | Hypothesis + code + results | `critique.md` | KILL / SUSPECT / PASS |
| 5 | Stress Test | `stage5_stress.py` | Python + Gemini | **Yes** | Backtest + 5 scenarios | `stress_analysis.md` | Max DD ≥ -50% |
| 6 | Walk-Forward | `stage6_walkforward.py` | Python | **Yes** | Train/test split data | Manifest update | Decay ≤ 50%, OOS Sharpe > 0 |
| 7 | Deploy | `stage7_deploy.py` | None | Human | All stage results | `deploy_report.md` → `/live` | Human approval |

---

*This report was generated by analyzing the complete source code of the WorkFlowEngine project, including all 9 pipeline modules, 4 prompt templates, the CLI entry point, and configuration files — totaling approximately 1,954 lines of Python and configuration code across 15 files.*
