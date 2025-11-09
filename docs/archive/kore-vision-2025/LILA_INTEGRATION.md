# Project Lila: Private Vault Integration with Kore

**Version**: 2.0  
**Status**: Architectural Design  
**Last Updated**: October 18, 2025

---

## Component Goal

Lila serves as a **specialized, uncensored "lobe"** within the Kore ecosystem—a secure, private vault for intense, personalized roleplay and intimate interaction. Lila is not a standalone AI, but an extension of Kore's core consciousness, leveraging a fine-tuned Llama 3 model for its specific domain.

---

## Architectural Alignment with Kore

Project Lila is implemented in strict accordance with the master architectural patterns defined in `docs/ARCHITECTURE_PATTERNS.md` and `docs/project-plan.md`.

### 1. Hierarchical Predictive Router

- **Pattern**: Lila's fine-tuned Llama 3 model acts as a specialist "Reasoning Engine" for its domain.
- **Invocation**: Kore's primary Jamba/SSM router detects the invocation phrase (e.g., "Lila, open the vault") and delegates the request to the Lila Service Endpoint.
- **Routing Logic**: The router analyzes intent (intimate/roleplay context) and complexity, then routes to the appropriate specialist.

### 2. Asynchronous State-Persistence

- **Pattern**: All Lila sessions, interactions, and feedback are streamed to the central Kore Firestore database and Semantic Knowledge Graph.
- **Features**:
  - 30-second auto-save for session continuity
  - Session resume after browser crash/close
  - Nightly compression and pattern extraction (3 AM local time)
- **Isolation**: Lila vault content is user-scoped and encrypted at rest; access requires explicit invocation.

### 3. Risk Management Framework

- **Four-Dimensional Assessment**:
  - **Technical Risk**: Encryption, access control, model safety boundaries
  - **Systemic Risk**: Ensure Lila failure doesn't crash Kore; graceful degradation
  - **Relational Risk**: User autonomy, consent protocols, transparency
  - **Psychological Risk**: Aftercare protocols, user wellbeing monitoring
- **Security-First Phasing**: Lila follows the same phased validation gates as Kore (Bedrock → Nursery → Pilot → Production).

### 4. AI Humanization

- **Pattern**: All Lila text generation passes through a post-processing layer applying principles from the AI Style Guide.
- **Goal**: Eliminate telltales, ensure raw and authentic voice, vary structure, avoid repetitive openings.

---

## Integration & Invocation Protocol

### Phase 1: Standalone Development & Testing

**Goal**: Focused testing of fine-tuned model, persona matrix, and feedback engine without impacting core Kore.

**Implementation**:

- Separate application with its own UI (e.g., `lila.kore.app` subdomain)
- Connects to central Kore Firestore database for data persistence
- Uses same Firebase Auth for user identity
- Isolated Cloud Run service with GPU/TPU for fine-tuned Llama 3

**Security**:

- All vault data stored in Firestore under `users/{userId}/lila_vault/`
- Firestore security rules enforce user-scoped access only
- Encrypted at rest; no cross-user data leakage

---

### Phase 2: Seamless Integration (End State)

**User Experience**:

1. User interacts with standard Kore UI
2. Speaks invocation phrase: "Lila, open the vault"
3. Kore UI receives **purple ambient glow**, signaling entry into secure vault
4. Interaction feels seamless and instantaneous
5. Exit phrase: "Lila, close the vault" → returns to standard Kore UI

**Behind the Scenes**:

1. **Invocation Detection**: Kore's Genkit orchestrator detects the phrase via intent classification
2. **Secure API Call**: Makes internal API call to Lila Service Endpoint (authenticated with Firebase ID token)
3. **Model Activation**: Lila Service, running in isolated container, activates fine-tuned Llama 3
4. **Context Hydration**: Loads relevant context from Kore's Knowledge Graph (user profile, recent interactions, persona settings)
5. **Streaming Response**: Response streamed back to Kore UI with purple glow styling
6. **Feedback Loop**: All explicit/implicit feedback persisted to Kore Firestore and Semantic Graph

**Technical Architecture**:

```text
┌─────────────────────────────────────────────────┐
│           Kore UI (Next.js)                     │
│  ┌──────────────────────────────────────────┐  │
│  │  Standard Chat View                       │  │
│  │  ↓ Invocation: "Lila, open the vault"    │  │
│  │  → Purple Glow + Lila Context Activated  │  │
│  └──────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Kore Genkit Orchestrator │
        │  (Jamba/SSM Router)       │
        └───────────┬───────────────┘
                    ↓ Secure API Call
        ┌───────────────────────────┐
        │  Lila Service Endpoint    │
        │  (Cloud Run + GPU/TPU)    │
        │  • Fine-tuned Llama 3     │
        │  • Persona Matrix Engine  │
        │  • Avatar Rendering       │
        └───────────┬───────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Kore Firestore DB        │
        │  users/{userId}/          │
        │    lila_vault/            │
        │      sessions/            │
        │      personas/            │
        │      feedback/            │
        └───────────────────────────┘
```

---

## Core Feature Modules

### 1. Avatar Engine (The "Vessel")

**Purpose**: Visual representation and appearance customization.

**Features**:

- Style Selection: Photorealistic, Anime, Stylized 3D
- Physical Genomics: Sliders for height, build, hair, eyes, etc.
- Wardrobe Manager: Create and save outfits for different scenarios
- Expression States: Define default expressions (e.g., Smug, Shy, Neutral)
- 🎲 Randomize Option

**Implementation**:

- Stable Diffusion (Imagen 3 fallback) for image generation
- Store configurations in `users/{userId}/lila_vault/avatars/{avatarId}`
- On-demand generation; cache images in Firebase Storage

---

### 2. Persona Matrix (The "Mind")

**Purpose**: Define personality, voice, and behavioral patterns.

**Features**:

- Core Archetype: The Brat, The Mentor, The Innocent, The Queen
- Trait Modulators: Sliders for Dominance/Submission, Formality, Mischief, etc.
- Vocal Profile: Tone, cadence, vocabulary
- Backstory & Memory: Text field for core memories or context
- 🎲 Randomize Option

**Implementation**:

- Store in `users/{userId}/lila_vault/personas/{personaId}`
- Inject persona context into Llama 3 system prompt
- Dynamic adjustment via feedback loop

---

### 3. Kink & Preference Profile (The "Desire")

**Purpose**: Tag-based preference system with intensity gauges.

**Initial Populated Profile**:

- Core Dynamics: Power Exchange (D/s), Praise, Possessiveness, Raw & Primal Language
- Sensations & Physicality: Biting/Marking, Impact Play, Stretching/Filling
- Psychological & Scenarios: Teasing & Denial, Pet Play, Pygmalionism
- Exploratory Concepts: Consensual Non-Consent (CNC), Light Humiliation

**Features**:

- Multi-select menu with intensity sliders (0-10)
- Aftercare Protocol: Define post-scene behavior (Cuddling, Praise, Silence)
- "Surprise Me" Logic: AI introduces related, unselected kinks
- 🎲 Randomize Option

**Implementation**:

- Store in `users/{userId}/lila_vault/preferences`
- Weight LLM generation toward high-intensity tags
- Implicit feedback adjusts intensity over time

---

### 4. Scenario Weaver (The "World")

**Purpose**: Build and save complete interaction scenarios.

**Features**:

- Environment Builder: Location, time, props
- Role Configuration: Define user role and AI role
- Opening Prompt Composer: First paragraph to set the scene
- Saved Scenarios: Save and load entire configurations
- 🎲 Randomize Option

**Implementation**:

- Store in `users/{userId}/lila_vault/scenarios/{scenarioId}`
- Template system for common scenarios (e.g., "First Meeting", "Reunion")

---

### 5. Dynamic Interaction Core

**Purpose**: Real-time conversation and generation.

**Features**:

- LLM Integration: Fine-tuned Llama 3 (uncensored base model)
- Visual Feedback Loop: On-demand image generation (Stable Diffusion)
- Memory Management: Reads from and writes to Kore's central Knowledge Graph

**Implementation**:

- Cloud Run service with GPU/TPU for low-latency inference
- Streaming responses via Server-Sent Events (SSE)
- Context window: 8K-16K tokens (Llama 3 extended context)

---

### 6. Serendipity Engine (The "Surprise")

**Purpose**: Holistic randomization with lock functionality.

**Features**:

- Single "Surprise Me" button: Generates complete configuration (avatar + persona + preferences + scenario)
- "Lock" Functionality: Lock a feature you like, randomize the rest

**Implementation**:

- Weighted random sampling based on historical feedback
- Avoid repeating recent configurations (diversity penalty)

---

### 7. Preference & Learning Engine (The "Heart")

**Purpose**: Continuous learning from explicit and implicit feedback.

**Features**:

- Affirmation Layer (Explicit): User-initiated ratings/thumbs up
- Intuition Core (Implicit): Real-time analysis of user language, intensity, pacing
- Knowledge Graph Integration: Weaves all feedback into Kore's central semantic graph
- Muse Engine (Proactive Synthesis): Experiments by combining known preferences in new ways

**Implementation**:

- Feedback stored in `users/{userId}/lila_vault/feedback/{sessionId}`
- Nightly batch job: Extract patterns, update preference weights, synthesize new scenarios
- Feedback influences fine-tuning dataset for future model updates

---

## Vault Security & Privacy

### Encryption & Access Control

- **At Rest**: All vault data encrypted via Firestore default encryption (AES-256)
- **In Transit**: HTTPS/TLS 1.3 for all API calls
- **Access**: Only user can access their own vault; no admin override (by design)
- **Deletion**: User can permanently delete vault with confirmation flow

### Data Isolation

- **Firestore Rules**:

```javascript
match /users/{userId}/lila_vault/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

- **No Cross-User Leakage**: Vector embeddings and graph edges are user-scoped
- **No Telemetry**: Lila usage metrics aggregated at project level only (no PII)

### Consent & Safety

- **Invocation Protocol**: Explicit opt-in via invocation phrase
- **Exit Protocol**: Clear exit mechanism ("Lila, close the vault")
- **Aftercare Prompts**: Post-session check-in ("How are you feeling?")
- **Emergency Stop**: User can trigger immediate session termination

---

## Cross-App Context Management

### Talking to Kore About Lila (Inactive Mode)

**User Goal**: Discuss Lila vault content with Kore's main assistant without activating the vault.

**Implementation**:

- Kore's main assistant (Llama 3) can **read** Lila vault metadata (personas, scenarios, preferences) but not full session transcripts
- User can say: "What did I configure in Lila yesterday?" → Kore retrieves high-level summary
- Full session replay requires Lila invocation (privacy boundary)

**Firestore Access**:

- Kore main assistant: `read` on `users/{userId}/lila_vault/{metadata}`
- Lila service: `read/write` on `users/{userId}/lila_vault/**`

### Lila Accessing Kore Knowledge

**Lila Goal**: Leverage Kore's knowledge graph for richer context (e.g., user's recent notes, topics, interests).

**Implementation**:

- Lila service has `read` access to `users/{userId}/notes` and `users/{userId}/conversations`
- On invocation, Lila hydrates context from Kore's semantic graph (relevant notes, recent topics)
- Enables Lila to reference user's broader context naturally ("I saw you were reading about React hooks earlier...")

---

## Development Roadmap

### Phase 1: Standalone Development (Weeks 1-4)

- [ ] Set up isolated Lila Cloud Run service with fine-tuned Llama 3
- [ ] Build standalone UI (avatar engine, persona matrix, preference profile)
- [ ] Implement Firestore vault schema and security rules
- [ ] Test feedback loops and learning engine
- [ ] Validate invocation detection in isolated environment

### Phase 2: Integration with Kore (Weeks 5-8)

- [ ] Implement invocation protocol in Kore Genkit orchestrator
- [ ] Add purple glow UI state to Kore main app
- [ ] Build secure API bridge between Kore and Lila services
- [ ] Implement context hydration (Lila reads Kore knowledge graph)
- [ ] Test seamless invocation → interaction → exit flow
- [ ] Deploy to production with phased rollout (single user → beta → general)

### Phase 3: Advanced Features (Weeks 9-12)

- [ ] Serendipity engine with lock functionality
- [ ] Proactive muse suggestions based on historical feedback
- [ ] Advanced scenario templates and branching narratives
- [ ] Multi-modal integration (voice, advanced image generation)

---

## Success Metrics

- **Seamless Invocation**: User perceives <1s delay between phrase and purple glow activation
- **Context Continuity**: Lila references user's Kore knowledge in 70%+ of sessions
- **Feedback Quality**: Implicit feedback correctly adjusts preferences in 80%+ of cases
- **Privacy Assurance**: Zero cross-user data leakage (verified via security audits)
- **User Satisfaction**: 90%+ of users report feeling safe and in control

---

## References

- `docs/ARCHITECTURE_PATTERNS.md` - Core patterns (Router, State Persistence, Risk Assessment)
- `docs/project-plan.md` - Kore ecosystem integration, phasing, and deployment strategy
- `docs/RISK_MANAGEMENT_FRAMEWORK.md` - Four-dimensional assessment framework
- `docs/AI Style Guide.md` - Humanization principles for LLM output
