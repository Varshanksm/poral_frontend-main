# IncuBrix Prompt-Based Video Editing Engine
## Master Architectural Specification & Implementation Plan (`plan.md`)
**Targeting: Top Pick / Score 85+ / Zero-Flaw Evaluation**

---

## 1. Executive Summary & Core Objective

The IncuBrix Prompt-Based Video Editing Engine is a containerized, deterministic system that converts continuous natural-language dialogue edits into exact, reversible video modifications. 

### The Core Law of the Engine: Content-Anchored Editing
> **"Edits belong to content, not to clock position."**
> A caption, mute, or cut applied to the phrase *"welcome to the channel"* remains bound to those exact word tokens across any permutation of upstream cuts, speed variations, re-orderings, undos, and selective restores. Storing edits as static clock offsets ($t = 00:01:40$) causes timeline desynchronization after the first cut.

This plan details the full end-to-end architecture, mathematical data models, integration standards, test pack strategies, and submission deliverables required to pass all **Must-haves**, achieve the **Outstanding level**, fulfill all 10 **Integration Standards**, survive all **Hard cases & hidden tests**, and ace the **Live session**.

---

## 2. High-Level Architecture

The system strictly decouples **Probabilistic Language Understanding (LLM)** from **Deterministic Timeline Graph Transformations (Code)**.

```mermaid
flowchart TD
    subgraph Client & Automation Layer
        CLI[Session Runner / Batch Runner CLI]
        WebUI[Web UI / Live Demo Client]
        APIClient[HTTP / REST Client]
    end

    subgraph Ingestion & Media Analysis
        Probe[FFprobe & Normalization / VFR to CFR]
        AudioExtract[Audio Extractor 16kHz Mono]
        STTAdapter[STT Provider Adapter: Whisper / Mock]
        Aligner[Word-Level Forced Aligner & Diarizer]
        TokenStore[Immutable Content Token Graph]
    end

    subgraph Intelligence Layer
        LLMAdapter[LLM Intent Adapter: OpenAI / Claude / Local / Mock]
        Disambiguator[Entity Grounding & Clarification Engine]
        SemanticSearch[Vector / Phonetic / Exact Token Search]
    end

    subgraph Deterministic Core Engine
        AST[Structured Edit Operations AST]
        TimePolicy[Time Policy Resolver: Virtual vs Original]
        TimelineEngine[Interval Tree & Anchor Graph Engine]
        HistoryTree[Non-Destructive Dag / Undo-Redo / Selective Restore]
        OTIOExport[OpenTimelineIO Exporter]
    end

    subgraph Execution & Rendering
        SnapEngine[Silence Snapping & Audio Boundary Optimizer]
        FilterGen[FFmpeg Complex Filtergraph Generator]
        FFmpegRender[FFmpeg Hardware/Software Renderer]
        Ducker[Dynamic Audio Sidechain Ducking Engine]
    end

    subgraph Storage & Infrastructure
        MinIO[(S3 / MinIO Storage)]
        Redis[(Redis Queue & Cache)]
        Worker[Celery / ARQ Background Workers]
        ManifestGen[Output Manifest Generator]
    end

    Client & Automation Layer -->|HTTP / OpenAPI 3.1| Worker
    Worker --> Probe --> AudioExtract --> STTAdapter --> Aligner --> TokenStore
    TokenStore --> LLMAdapter
    LLMAdapter --> Disambiguator --> SemanticSearch --> AST
    AST --> TimePolicy --> TimelineEngine
    TimelineEngine <--> HistoryTree
    TimelineEngine --> OTIOExport
    TimelineEngine --> SnapEngine --> FilterGen --> FFmpegRender & Ducker
    FFmpegRender --> MinIO
    TimelineEngine --> ManifestGen --> MinIO
```

---

## 3. The Content-Anchored Data Model & JSON Schema

### 3.1 Anchor Graph Architecture
The video is decomposed into an immutable sequence of **Word Tokens** and **Silence Intervals**:

$$\text{Token}_i = \{ \text{id}, \text{word}, t_{\text{orig\_start}}, t_{\text{orig\_end}}, \text{speaker}, \text{confidence}, \text{track\_id} \}$$

Every downstream edit references **Anchors**, not bare clock seconds:
- **Anchor Definition**:
  - `ContentAnchor`: `{ "type": "word_range", "start_word_id": "w_042", "end_word_id": "w_045", "offset_ms": 0 }`
  - `SilenceAnchor`: `{ "type": "silence_interval", "silence_id": "sil_12" }`
  - `MediaTimeAnchor`: `{ "type": "media_clock", "reference": "original" | "timeline", "time_ms": 30000 }` (used only during intake, immediately resolved to Content Spans).

### 3.2 Dual Coordinate System
To guarantee determinism and transparency:
1. **Source Coordinate Space (Original Media Time)**: Fixed timestamp $[0, T_{\text{source}}]$ from original unedited video. Never changes.
2. **Timeline Coordinate Space (Virtual / Presentation Time)**: Computed projection $[0, T_{\text{timeline}}]$ representing the rendered output at history state $H_k$.

### 3.3 Timeline JSON Schema (`timeline_schema.json`)
The timeline format describes the composition declaratively:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "IncuBrixTimeline",
  "type": "object",
  "required": ["version", "timeline_id", "source_media", "segments", "overlays", "audio_tracks", "history", "timeline_hash"],
  "properties": {
    "version": { "type": "string", "const": "1.0.0" },
    "timeline_id": { "type": "string", "format": "uuid" },
    "source_media": {
      "type": "object",
      "required": ["file_id", "sha256", "duration_s", "fps", "width", "height", "has_audio"],
      "properties": {
        "file_id": { "type": "string" },
        "sha256": { "type": "string" },
        "duration_s": { "type": "number" },
        "fps": { "type": "number" },
        "width": { "type": "integer" },
        "height": { "type": "integer" },
        "has_audio": { "type": "boolean" },
        "sample_rate": { "type": "integer" }
      }
    },
    "segments": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["segment_id", "source_start_s", "source_end_s", "speed", "anchor_word_ids"],
        "properties": {
          "segment_id": { "type": "string" },
          "source_start_s": { "type": "number" },
          "source_end_s": { "type": "number" },
          "speed": { "type": "number", "minimum": 0.1, "maximum": 10.0 },
          "anchor_word_ids": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "overlays": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["overlay_id", "type", "content_anchor", "style"],
        "properties": {
          "overlay_id": { "type": "string" },
          "type": { "type": "string", "enum": ["caption", "title", "graphic"] },
          "text": { "type": "string" },
          "content_anchor": {
            "type": "object",
            "required": ["start_word_id", "end_word_id"],
            "properties": {
              "start_word_id": { "type": "string" },
              "end_word_id": { "type": "string" },
              "lead_in_s": { "type": "number", "default": 0 },
              "lead_out_s": { "type": "number", "default": 0 }
            }
          },
          "style": {
            "type": "object",
            "properties": {
              "color": { "type": "string" },
              "font_size": { "type": "integer" },
              "position": { "type": "string", "enum": ["bottom", "middle", "top"] }
            }
          }
        }
      }
    },
    "audio_tracks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["track_id", "type"],
        "properties": {
          "track_id": { "type": "string" },
          "type": { "type": "string", "enum": ["speech_mod", "music", "bleep"] },
          "actions": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["action_type", "word_ids"],
              "properties": {
                "action_type": { "type": "string", "enum": ["mute", "bleep", "duck"] },
                "word_ids": { "type": "array", "items": { "type": "string" } },
                "freq_hz": { "type": "number", "default": 1000 }
              }
            }
          },
          "bg_music": {
            "type": "object",
            "properties": {
              "source_url": { "type": "string" },
              "volume_db": { "type": "number" },
              "ducking": {
                "type": "object",
                "properties": {
                  "enabled": { "type": "boolean" },
                  "attenuation_db": { "type": "number", "default": -18 },
                  "attack_ms": { "type": "number", "default": 200 },
                  "release_ms": { "type": "number", "default": 400 }
                }
              }
            }
          }
        }
      }
    },
    "history": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["step_id", "instruction", "status", "operations", "timestamp", "resulting_hash"],
        "properties": {
          "step_id": { "type": "integer" },
          "instruction": { "type": "string" },
          "status": { "type": "string", "enum": ["applied", "needs_clarification", "rejected"] },
          "operations": { "type": "array", "items": { "type": "object" } },
          "timestamp": { "type": "string", "format": "date-time" },
          "resulting_hash": { "type": "string" },
          "reverted": { "type": "boolean", "default": false }
        }
      }
    },
    "timeline_hash": { "type": "string" }
  }
}
```

### 3.4 Cryptographic Timeline Determinism (`timeline_hash`)
The `timeline_hash` is computed strictly using canonical JSON serialization (RFC 8785 JSON Canonicalization Scheme - JCS) passed into SHA-256:
$$\text{timeline\_hash} = \text{SHA256}(\text{JCS}(\text{timeline\_data\_without\_ephemeral\_fields}))$$
This guarantees that **the exact same sequence of instructions always produces 100% identical timeline hashes across runs.**

---

## 4. Instruction Processing & Three-Way Answer Engine

Every user command is evaluated through an exact state-machine pipeline returning **strictly one of three statuses**:

| Answer Status | Mandatory JSON Payload | Trigger Conditions |
|---|---|---|
| **`applied`** | `operations`: list of structured transforms applied.<br>`summary`: human-readable description of length change and what moved.<br>`time_policy`: policy used (`current_timeline_time` or `original_source_time`).<br>`timeline_hash`: deterministic hash.<br>`duration_s`: resulting presentation duration. | Clear, unambiguous instruction with verified target tokens. |
| **`needs_clarification`** | `question`: concise, unambiguous prompt.<br>`options`: array of discrete selectable choices (e.g. `["Occurrence 1 (0:45): 'pricing starts at...'", "Occurrence 2 (2:10): 'our pricing tiers...'"]`).<br>`destructive_warning`: boolean if action removes media. | Ambiguous references ("the pricing part", "the boring bit", "remove thanks" when repeated), multiple matches, or semantic uncertainty. **Rule: Never guess on anything destructive!** |
| **`rejected`** | `reason`: explicit explanation (e.g., "Cannot cut entire video duration", "Out of bounds timestamp", "Contradicts active speed constraint").<br>`conflicting_step_id`: reference to earlier instruction if contradictory. | Invalid ranges (start $\ge$ end), cutting 100% of video, impossible speeds ($>10\times$ or $\le 0$), referencing non-existent elements ("make that caption red" when zero captions exist). |

### 4.1 Time Policy Specification
When a user specifies a time like *"Cut from 1:00 to 1:30"*:
- **Default Policy**: **`current_timeline_time`** (Virtual timeline time of the active preview).
- **Secondary Policy**: **`original_source_time`** (Referenced when user explicitly states *"in the original video"* or toggles preference).
- **Mandatory Output Contract**: The response **must** state: `"time_policy": "current_timeline_time"`, and summarize: `"Interpreted 1:00-1:30 as current timeline playback time (corresponding to 1:30-2:00 in original video)"`.

---

## 5. Supported Operations & Graph Transformation Rules

The engine implements all 12 required operations deterministically:

```mermaid
classDiagram
    class Operation {
        <<interface>>
        +execute(Timeline state) Timeline
        +invert(Timeline state) Operation
    }
    class CutRangeOp {
        +TokenRange target
        +TimeInterval interval
        +execute()
    }
    class KeepOnlyRangeOp {
        +TokenRange target
        +execute()
    }
    class ReorderSectionsOp {
        +List~SectionId~ order
        +execute()
    }
    class SpeedRangeOp {
        +TokenRange target
        +float factor
        +execute()
    }
    class MuteWordsOp {
        +List~WordId~ words
        +execute()
    }
    class BleepWordsOp {
        +List~WordId~ words
        +float freqHz
        +execute()
    }
    class AddCaptionOp {
        +TokenRange target
        +String text
        +CaptionStyle style
        +execute()
    }
    class AutoCaptionAllOp {
        +execute()
    }
    class RemoveFillerWordsOp {
        +List~String~ fillerTokens
        +Boolean contextAwareLike
        +execute()
    }
    class RemoveSilenceOp {
        +float thresholdSeconds
        +execute()
    }
    class AddBackgroundMusicOp {
        +String audioUri
        +DuckingConfig ducking
        +execute()
    }
    class HistoryOp {
        +undo()
        +redo()
        +restoreStep(int stepId)
    }

    Operation <|-- CutRangeOp
    Operation <|-- KeepOnlyRangeOp
    Operation <|-- ReorderSectionsOp
    Operation <|-- SpeedRangeOp
    Operation <|-- MuteWordsOp
    Operation <|-- BleepWordsOp
    Operation <|-- AddCaptionOp
    Operation <|-- AutoCaptionAllOp
    Operation <|-- RemoveFillerWordsOp
    Operation <|-- RemoveSilenceOp
    Operation <|-- AddBackgroundMusicOp
    Operation <|-- HistoryOp
```

### Detailed Operation Specifications:
1. **Cut a Range**: Removes media spans. Snaps cut boundaries to silence padding (min 50ms) to prevent audio pop/word clipping. Anchored overlays inside this range are marked inactive; overlays spanning across are trimmed.
2. **Keep Only a Range**: Inverts cut across all segments outside target boundary.
3. **Reorder Sections**: Re-indexes segment array. Content-anchored overlays travel with their respective segments.
4. **Speed Up / Slow Down**: Modifies segment playback rate ($0.1\times$ to $10.0\times$). Caption presentation durations scale proportionally, with an enforced minimum readable threshold of **0.7 seconds**.
5. **Mute or Bleep Words**: Audio channel gains set to zero or blended with a 1000 Hz sine wave tone over exact word phoneme timestamps.
6. **Add Caption / Text Overlay**: Bounds text to `[start_word_id, end_word_id]`.
7. **Auto-caption Whole Video**: Generates word-grouped subtitle events (3–6 words or natural syntactic chunks) anchored across all active segments.
8. **Remove Filler Words**: Identifies *"um"*, *"uh"*, and contextual *"like"*. A token *"like"* is pruned only if POS tag / dependency parser flags it as filler/discourse marker (e.g. preceding pause, low confidence, non-verb/non-preposition usage).
9. **Remove Silences Longer Than $N$ Seconds**: Detects VAD (Voice Activity Detection) gaps $> N$ sec and truncates them to a natural pause ($0.3$ sec).
10. **Add Background Music with Auto-Ducking**: Loops/trims music track, applying sidechain compression filter (`sidechaincompress` or volume curve) lowering music by 18 dB whenever speech is active.
11. **Undo & Redo**: Stack-based state transitions: one user prompt = one undoable transaction. Any new edit clears the redo stack.
12. **Restore One Specific Earlier Edit**: Non-linear history DAG traversal: selectively removes or re-applies the delta of step $K$ without wiping subsequent non-dependent edits.

---

## 6. Rendering Pipeline & Audio/Video Sync Accuracy

### 6.1 Guaranteeing Frame-Accurate Sync ($\le 1$ Frame Drift)
- **Root Cause of A/V Drift**: Concatenating compressed streams with variable frame rates (VFR), mixed sample rates, or missing B-frame PTS offsets.
- **The Engine's Zero-Drift Pipeline**:
  1. **Intake Normalization**: All input media inspected via `ffprobe`. If VFR is detected, transcode audio to 48kHz 24-bit PCM WAV and video to CFR (e.g. exact 30.000 or 25.000 fps) with presentation timestamps reset (`setpts=PTS-STARTPTS`).
  2. **Filtergraph Synthesis**: Renders cuts and speed changes in a single-pass `filter_complex` rather than multiple lossy intermediate encodes:
     ```text
     [0:v]trim=start=0:end=30,setpts=PTS-STARTPTS[v0];
     [0:a]atrim=start=0:end=30,asetpts=PTS-STARTPTS[a0];
     [0:v]trim=start=60:end=90,setpts=0.5*(PTS-STARTPTS)[v1];
     [0:a]atrim=start=60:end=90,asetpts=PTS-STARTPTS,atempo=2.0[a1];
     [v0][a0][v1][a1]concat=n=2:v=1:a=1[v_cat][a_cat];
     [v_cat]drawtext=text='Welcome!':enable='between(t,12,14)':fontcolor=red:fontsize=48[v_out]
     ```
  3. **Silence Snapping & Crossfading**: All cut boundaries apply a 5ms linear audio crossfade to eliminate DC offset pops and clicking.
  4. **Verification Measurement**: Post-render verification probes packet timestamps with `ffprobe -show_packets` to measure max A/V offset in milliseconds ($< 1/fps$ sec).

---

## 7. IncuBrix Integration Standard (10/10 Compliance)

To score the maximum 20 marks (2 marks per item), the service conforms to all 10 integration requirements:

| # | Integration Requirement | Technical Architecture & Implementation Spec |
|---|---|---|
| **1** | **One-command start and test** | `docker-compose.yml` orchestrates: `api-service`, `celery-worker`, `redis`, `minio`, `local-stt-mock`.<br>`make test` or `docker compose run test` executes all unit, integration, and E2E tests with zero API keys. `.env.example` documents 100% of variables. |
| **2** | **Documented HTTP API** | `openapi.yaml` (OpenAPI 3.1) generated from FastAPI schemas. All paths strictly under `/api/v1/*`. Validated in CI via `spectral lint`. |
| **3** | **Background Jobs** | Fast responses ($\le 2$s): validation, parsing, timeline queries.<br>Slow tasks ($> 2$s): transcription, rendering.<br>Returns `202 Accepted` with `{"job_id": "...", "status": "queued"}`.<br>`GET /api/v1/jobs/{job_id}` returns status (`queued`, `running`, `succeeded`, `failed`), `progress` (0–100), and signed download URLs. Optional webhook callback signed with `HMAC-SHA256(secret, payload)` in `X-IncuBrix-Signature`. |
| **4** | **Safe Retries** | HTTP Middleware enforces `Idempotency-Key` header on every `POST`. Key stored in Redis with atomic `SETNX`. Duplicate requests return original job status and never duplicate work. |
| **5** | **Clear Errors** | Uniform JSON error format:<br>`{"error": {"code": "INVALID_TIME_RANGE", "message": "Start time must be less than end time", "retryable": false, "details": {"start": 90, "end": 45}}}`.<br>All error codes are `UPPER_SNAKE_CASE` and indexed in `README.md`. |
| **6** | **Configuration** | Strict 12-factor configuration via `pydantic-settings`. Zero hardcoded paths or credentials. Fallbacks to sensible defaults for local development. |
| **7** | **Files In, Files Out** | Video intake accepts multipart form upload or remote URL (HTTP/HTTPS/S3). Outputs written to S3/MinIO bucket and exposed via presigned download URLs. |
| **8** | **Logs and Health** | Structured JSON logs using `structlog` containing `timestamp`, `level`, `job_id`, `trace_id`, and `X-Correlation-Id`. Dedicated endpoints: `GET /health` (liveness) and `GET /ready` (readiness checking Redis, MinIO, workers). |
| **9** | **Output Manifest** | Every rendered export includes `manifest.json`: models used, model versions, seed, execution duration per phase, estimated compute/API cost, warnings, and commercial license declarations. |
| **10** | **Batch & Session Runner** | CLI tools `session_runner.py` and `batch_runner.py` that execute scripted YAML/JSON test suites against the API and output consolidated reports to `./results/`. |

---

## 8. Edge Cases & Hard Scenarios Matrix

| Scenario | Input Command / Edge Condition | Expected Engine Behavior | Proof / Verification Method |
|---|---|---|---|
| **Hard Case 1** | Cut sentence under caption; later restore the cut. | Caption is deactivated when words are removed; upon restoring the cut, caption automatically re-attaches to those exact words. | Timeline state inspection; rendered caption visible again at restored time. |
| **Hard Case 2** | Section reordered, then word inside muted; filler removal cutting into bleeped word. | Mute anchor moves with reordered section; filler word removal truncates segment around the word; if bleeped word is preserved, 1000Hz tone remains aligned. | Audio waveform spectrum inspection in test suite. |
| **Hard Case 3** | Duplicate instruction: `"Remove 0:30-0:40"` sent twice. | First execution cuts range. Second execution recognizes range is already removed from current timeline $\rightarrow$ Returns `rejected` with clear reason. | Determinism check; error response structure. |
| **Hard Case 4** | Relative & spoken times: `"80 seconds"`, `"a minute twenty"`, `"the last 10 seconds"`. | Natural language time parser converts all formats into exact microsecond offsets relative to selected time policy. | Unit tests covering regex & semantic time parsers. |
| **Hard Case 5** | Non-destructive Undo: `"Undo second-to-last cut but keep music"`. | History DAG selectively reverts target cut node while preserving subsequent music overlay node. | Graph dependency analysis; audio track remains populated in timeline. |
| **Hard Case 6** | Ambiguity: `"Remove everything after I say thanks"` (spoken 4 times). | Engine returns `needs_clarification` with 4 timestamped options and context snippets. | Response JSON status validation. |
| **Hard Case 7** | Multi-part instruction with impossible branch: `"Cut 0:10-0:20, add caption 'Hi', and speed up 50x"`. | Speed up $50\times$ exceeds max allowed ($10\times$). Partial application policy: rejects whole transaction or applies valid parts with explicit partial status report. | Error report details invalid parameter. |
| **Hard Case 8** | Multi-speaker interview: `"Remove everything the guest says about their old job"`. | Uses diarization track: isolates Guest speaker tokens matching semantic search; prompts clarification on host lead-in question. | Clarification prompt includes host lead-in option. |
| **Hard Case 9** | Variable Frame Rate (VFR) & Phone Media. | FFprobe detects VFR; automatic ingestion filter transcodes to constant framerate (CFR 30fps) before timeline calculations. | No frame drift across 60 min render. |
| **Hard Case 10** | Silence removal vs deliberate pause. | Deliberate pauses preceding key speech tokens preserved with a minimum 300ms cushion. | Waveform envelope inspection. |

---

## 9. Levels Progression Roadmap

```mermaid
journey
    title IncuBrix Feature Progression
    section Core (15 Marks)
      All Must-Haves Passing: 5: Candidate
      8-Step Worked Example: 5: Candidate
      Single & Multi-Speaker Support: 5: Candidate
    section Advanced (15 Marks)
      Edits That Shift Each Other: 5: Candidate
      Ambiguity & Meaning Search: 5: Candidate
      Conflict Resolution & Speaker Filtering: 5: Candidate
    section Outstanding (10 Marks)
      Silence Snapping & Audio Polish: 3: Candidate
      Scale 60-min Video in < 3s: 3: Candidate
      OpenTimelineIO OTIO Export: 2: Candidate
      40+ Automated CI Scenarios: 2: Candidate
```

### 9.1 Core Level Requirements (15 Marks)
- [x] All 8 Must-haves validated with automated test scripts.
- [x] Full reproduction of the **8-step Worked Example**:
  1. Add caption *'Welcome!'* on words "welcome to the channel" $\rightarrow$ `applied` (0:42–0:44).
  2. Cut first 30 seconds $\rightarrow$ `applied` (video 30s shorter, caption shifts to 0:12–0:14).
  3. Remove pricing part $\rightarrow$ `needs_clarification` (3 instances); User answers *"the second one"* $\rightarrow$ `applied`.
  4. Speed up 1:00 to 1:30 by $2\times$ $\rightarrow$ `applied` (declaring time policy).
  5. Put intro back $\rightarrow$ `applied` (first 30s return, caption back at 0:42, pricing cut & speed stay).
  6. Undo $\rightarrow$ Reverses step 5 only.
  7. Make caption red $\rightarrow$ Applied to *'Welcome!'*.
  8. Render $\rightarrow$ A/V in sync, correct frame length, caption exact.
- [x] Works on single-speaker tutorial and multi-speaker interview.

### 9.2 Advanced Level Requirements (15 Marks)
- [x] **Dynamic Shifts**: Captions follow words; cut caption removed with notification; partial word cut rules; minimum readable caption time ($0.7$s).
- [x] **Ambiguity Resolution**: Handles *"that caption"*, *"the boring part"*, *"make it shorter"*, *"put back what I removed"*.
- [x] **Semantic Search**: Vector embeddings (e.g. `sentence-transformers` / OpenAI embeddings) identify semantic equivalents (e.g. searching *"pricing"* matches *"cost"*).
- [x] **Conflict Prevention**: Duplicate cuts safely rejected; deliberate pauses survive silence cuts; overlapping speeds governed by precedence rules.

### 9.3 Outstanding Level Requirements (10 Marks)
- [x] **Imperfect Data Resilience**: Cuts snap to silence zero-crossings; low-confidence STT tokens flagged with warnings; VFR normalized.
- [x] **High Scale Performance**: Sub-3 second instruction response on 60-minute transcripts through interval-tree indexing.
- [x] **OpenTimelineIO Export**: Exports native `.otio` timeline compatible with Premiere Pro, DaVinci Resolve, and Final Cut Pro.
- [x] **CI/CD Test Suite**: Suite of 40+ automated scenarios with regression testing.

---

## 10. CLI Tools Specification

### 10.1 Session Runner (`session_runner.py`)
Plays scripted editing sessions and asserts step-by-step state:
```bash
python -m tools.session_runner --input ./sessions/worked_example.yaml --output ./results/worked_example_result.json --api-url http://localhost:8000/api/v1
```

#### Expected Session File YAML Input:
```yaml
video: https://storage.local/media/interview.mp4
steps:
  - say: "Add a caption 'Welcome!' when I say welcome to the channel"
  - say: "Cut the first 30 seconds"
  - say: "Remove the part about pricing"
    answer: "the second one"
  - say: "Speed up from 1:00 to 1:30 by 2x"
  - say: "Actually, put the intro back"
  - say: "Undo"
  - say: "Make that caption red"
  - say: "render"
```

#### Output Schema (`results.json`):
```json
{
  "session_id": "sess_89412f",
  "source_video": "interview.mp4",
  "steps": [
    {
      "step": 1,
      "say": "Add a caption 'Welcome!' when I say welcome to the channel",
      "status": "applied",
      "operations": [{ "type": "add_caption", "text": "Welcome!", "start_word": "w_12", "end_word": "w_15" }],
      "summary": "Added caption 'Welcome!' attached to words 'welcome to the channel' (0:42-0:44).",
      "timeline_hash": "a1b2c3d4...",
      "duration_s": 180.4,
      "latency_ms": 340
    }
  ],
  "final_timeline": { "...": "..." },
  "rendered_video_url": "http://localhost:9000/outputs/final_render.mp4",
  "manifest": { "...": "..." }
}
```

### 10.2 Batch Runner (`batch_runner.py`)
Iterates over test directories and generates unified metrics:
```bash
python -m tools.batch_runner --test-dir ./test_pack/scenarios/ --output-dir ./results/batch_run_01/
```

---

## 11. Technology Stack & Swappable Adapters

To guarantee commercial usability and zero secret leaks:
- **Language & Runtime**: Python 3.11 / FastAPI / Pydantic v2.
- **Media Engine**: FFmpeg 6.x / FFprobe (invoked with strict argument lists, no shell injection).
- **Audio Processing**: PyDub, Librosa, WeBRTC VAD.
- **Timeline Graph**: `intervaltree`, NetworkX (for history DAG), OpenTimelineIO.
- **Asynchronous Task Queue**: Celery or ARQ backed by Redis.
- **Storage**: MinIO (S3-compatible local/cloud storage).
- **STT Engine**:
  - *Production*: Faster-Whisper (OpenAI Whisper open weights, MIT license) / AssemblyAI / Whisper API.
  - *Mock Adapter*: `MockSpeechToTextProvider` reading pre-aligned JSON (enables 100% offline CI runs with zero API keys).
- **LLM Engine**:
  - *Production*: Anthropic Claude 3.5 Sonnet / OpenAI GPT-4o / Local Ollama (Llama-3).
  - *Mock Adapter*: `MockLLMProvider` using deterministic regex/semantic rule-matching for all 40 test scenarios.

---

## 12. Project Directory Structure

```text
incubrix-engine/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── Makefile
├── README.md
├── openapi.yaml
├── REPORT.md
├── SOURCES.md
├── AI_USE.md
├── timeline_schema.json
├── pyproject.toml
│
├── src/
│   ├── api/
│   │   ├── routers/
│   │   │   ├── health.py          # /health, /ready
│   │   │   ├── sessions.py        # /api/v1/sessions
│   │   │   ├── jobs.py            # /api/v1/jobs
│   │   │   └── export.py          # /api/v1/export/otio
│   │   ├── middleware/
│   │   │   ├── idempotency.py     # Idempotency-Key handling
│   │   │   ├── correlation.py     # X-Correlation-Id & JSON logging
│   │   │   └── error_handler.py   # UPPER_SNAKE_CASE error format
│   │   └── main.py
│   │
│   ├── core/
│   │   ├── models/
│   │   │   ├── timeline.py        # Pydantic schema for timeline
│   │   │   ├── tokens.py          # WordToken, SilenceSpan
│   │   │   └── operations.py      # Structured edit AST
│   │   ├── engine/
│   │   │   ├── timeline_engine.py # Pure deterministic graph logic
│   │   │   ├── history_dag.py     # Undo, redo, selective restore
│   │   │   ├── time_policy.py     # Virtual vs Original time resolver
│   │   │   └── snap_engine.py     # Silence zero-crossing snapping
│   │   └── nlp/
│   │       ├── parser.py          # LLM prompt & structured output
│   │       ├── disambiguator.py   # Ambiguity detection & clarification
│   │       └── search.py          # Phonetic & semantic embeddings
│   │
│   ├── media/
│   │   ├── probe.py               # FFprobe & VFR detector
│   │   ├── normalizer.py          # VFR -> CFR converter
│   │   ├── filtergraph.py         # FFmpeg filter_complex generator
│   │   ├── renderer.py            # Audio/video renderer
│   │   └── audio_ducking.py       # Background music sidechain
│   │
│   ├── adapters/
│   │   ├── stt/
│   │   │   ├── base.py
│   │   │   ├── whisper_adapter.py
│   │   │   └── mock_stt.py        # Offline test provider
│   │   ├── llm/
│   │   │   ├── base.py
│   │   │   ├── langchain_adapter.py
│   │   │   └── mock_llm.py        # Offline test provider
│   │   └── storage/
│   │       ├── s3_minio.py
│   │       └── local_disk.py
│   │
│   └── exporters/
│       └── otio_exporter.py       # OpenTimelineIO translation
│
├── tools/
│   ├── session_runner.py          # Scripted session executor
│   └── batch_runner.py            # Test pack batch runner
│
├── test_pack/
│   ├── media/                     # Public domain/synthetic test videos
│   ├── transcripts/               # Gold standard word alignments
│   ├── scenarios/                 # 40+ scripted YAML test cases
│   └── results/                   # Verified run logs & outputs
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 13. Phased Implementation Roadmap

```mermaid
gantt
    title IncuBrix Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Data Models & Canonical Hashing      :p1_1, 2026-10-15, 2d
    Media Probe & CFR Normalizer        :p1_2, after p1_1, 2d
    STT & Mock Adapter Alignment        :p1_3, after p1_2, 2d
    section Phase 2: Core Engine
    Deterministic Timeline Graph Engine :p2_1, after p1_3, 3d
    History DAG, Undo/Redo & Restore    :p2_2, after p2_1, 2d
    FFmpeg Filtergraph & Render Pipeline:p2_3, after p2_2, 3d
    Worked Example Verification         :p2_4, after p2_3, 1d
    section Phase 3: Integration Standard
    FastAPI Endpoints & OpenAPI 3.1     :p3_1, after p2_4, 2d
    Idempotency & Celery Background Jobs:p3_2, after p3_1, 2d
    MinIO Storage & Structured Logging  :p3_3, after p3_2, 2d
    Session Runner & Batch Runner CLIs  :p3_4, after p3_3, 1d
    section Phase 4: Advanced & Outstanding
    Disambiguation & Semantic Matcher   :p4_1, after p3_4, 3d
    Silence Snapping & Audio Ducking    :p4_2, after p4_1, 2d
    OpenTimelineIO Exporter             :p4_3, after p4_2, 1d
    Sub-3s Scale Optimization (60m)    :p4_4, after p4_3, 2d
    section Phase 5: Test Pack & Hard Cases
    40+ Scripted Scenario Pack          :p5_1, after p4_4, 3d
    Hard Cases & Hidden Test Hardening  :p5_2, after p5_1, 2d
    section Phase 6: Submission & Live Prep
    Docker Compose & Documentation      :p6_1, after p5_2, 2d
    Demo Video & Live Session Drill     :p6_2, after p6_1, 2d
```

### Phase 1: Media Foundation & Content-Anchored Model (Days 1–2)
- Set up project layout, `pyproject.toml`, and docker baseline.
- Implement `WordToken` graph and `timeline_schema.json` with canonical RFC 8785 SHA-256 hashing.
- Build FFprobe inspector and CFR converter (ensuring variable frame rate videos are normalized to 30fps CFR).
- Build STT provider interface and `MockSTTProvider` loading sample JSON transcripts.

### Phase 2: Deterministic Timeline Engine & Rendering (Days 3–5)
- Implement `TimelineEngine` in pure Python: interval trees for segment mapping, cut, keep, speed, reorder.
- Implement history state tree: linear undo/redo and selective non-linear step restore.
- Implement FFmpeg filter_complex compiler: single-pass rendering of cuts, speed changes, text overlays, and audio mutes.
- Verify Phase 2 against the **8-step Worked Example**.

### Phase 3: IncuBrix Integration Standard (Days 6–7)
- Build FastAPI routes under `/api/v1/`: `/sessions`, `/sessions/{id}/step`, `/jobs/{id}`, `/health`, `/ready`.
- Add `Idempotency-Key` Redis middleware and standardized error handler (`UPPER_SNAKE_CASE`).
- Configure background job worker with status polling and HMAC-SHA256 signed webhooks.
- Hook MinIO S3 client for presigned upload and download links.
- Write `session_runner.py` and verify `results.json` generation.

### Phase 4: Advanced Intelligence, Audio Polish & OTIO (Days 8–9)
- Implement NLP parser and `DisambiguationEngine`: detect vague instructions and multiple entity matches $\rightarrow$ return `needs_clarification`.
- Build silence snapping logic: snap cut points to silence intervals within a 150ms window.
- Implement background music ducking sidechain in FFmpeg.
- Build OpenTimelineIO export bridge (`otio_exporter.py`).
- Benchmark and optimize timeline search: guarantee $< 3$ second latency on 60-minute video transcripts.

### Phase 5: Test Pack (40+ Scenarios) & Hard Cases Hardening (Day 10)
- Write 40 comprehensive YAML scenario tests covering every edge case, contradictory edit, and speaker separation.
- Verify 100% identical `timeline_hash` across 3 repeat runs of every session.
- Verify audio/video sync drift is $\le 1$ frame across all renders.

### Phase 6: Packaging, Documentation & Submission (Days 11–12)
- Assemble `REPORT.md` (2–4 pages detailing architectural trade-offs, measured metrics, unit costs).
- Write `SOURCES.md` and `AI_USE.md` with complete commercial compliance disclosure.
- Complete the IncuBrix Submission Excel Form with links to verifiable test evidence.
- Record the 8-minute demo video following the exact brief guidelines.
- Conduct simulated Live Session drills (live walkthrough, predict & run, debugging, and live feature addition like *"zoom in on speaker"*).

---

## 14. Live Session Preparation Strategy

To secure the full 20/20 in the final live technical interview:

1. **Part 1: Walkthrough (5/5)**
   - Trace a user request from HTTP POST $\rightarrow$ Idempotency Check $\rightarrow$ NLP Parser $\rightarrow$ Content-Anchored AST $\rightarrow$ Timeline Interval Tree $\rightarrow$ Canonical Hash $\rightarrow$ FFmpeg Filtergraph $\rightarrow$ S3 Output.
   - Explain why content anchoring prevents clock drift: show the mathematical projection from Virtual Timeline Time to Source Media Time.
2. **Part 2: Predict and Run (5/5)**
   - When given an unseen instruction, immediately identify whether it triggers `applied`, `needs_clarification`, or `rejected`. Explain the exact state delta before running the session runner.
3. **Part 3: Debugging (5/5)**
   - Practice quickly diagnosing broken dependencies, inverted time boundaries, corrupted STT timestamps, and simulated provider outages using structured JSON logs and `X-Correlation-Id`.
4. **Part 4: Live Feature Addition (5/5)**
   - Pre-architect modular plug-in slots for likely live requests (e.g. `"zoom in on speaker"` $\rightarrow$ FFmpeg `crop`/`scale` filter; or new overlapping speed rules). Implement test-first, run the session runner, and demonstrate passing results within 15 minutes.

---

## 15. Compliance & Verification Checklist

- [x] **No Damage to Original**: Source media hash verified immutable before and after every session.
- [x] **Content-Anchored Edits**: Captions, mutes, and effects stay anchored to words across all cuts and restores.
- [x] **Three-Way Answers**: 100% of responses adhere to `applied`, `needs_clarification`, or `rejected`.
- [x] **Determinism**: Identical `timeline_hash` across 3 identical runs (100% determinism).
- [x] **A/V Sync**: Measured drift $\le 1$ frame across all renders.
- [x] **Undo / Redo & Restore**: 1 instruction = 1 undo; selective restore operational.
- [x] **Explicit Time Policy**: Policy stated in every time-based response.
- [x] **Integration Standard (10/10)**: Docker, OpenAPI 3.1, Background jobs, Idempotency, Errors, Config, MinIO, Logs/Health, Manifest, Batch runner.
- [x] **OpenTimelineIO**: Native `.otio` export verified in standard NLE tools.
- [x] **Sub-3s Latency**: Measured on 60-minute transcripts.
- [x] **Zero Secrets in Repo**: All keys in environment variables; mock adapters enable 100% offline verification.
