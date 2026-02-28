
**The proposed visual language systems are built on a foundation that is roughly half solid science and half
wishful thinking.** Astral Script and Codex Signum invoke legitimate semiotic theory and well-established
perceptual science, but several core claims — the 8-15 Hz pulsation range for alerts, the "8-10× monitoring
advantage" over text, and the notion of aesthetic principles encoding grammar — range from dangerously
contraindicated to entirely unsupported. The strongest elements of the design (modular composition from
geometric primitives, luminance-based state encoding, multi-layered interpretation) have genuine precedent in
Chinese characters, ISO safety signs, and Treisman's Feature Integration Theory. The weakest elements reflect a
pattern common to constructed visual languages throughout history: over-reliance on iconicity for abstract
concepts, false universalism, and conflation of aesthetic appeal with functional communication. What follows is
a rigorous, section-by-section audit drawing on Peirce, Saussure, Eco, Treisman, Endsley, Arnheim, and modern
empirical research to distinguish the grounded from the speculative.
---
## The semiotic foundations are strong but misapplied in key places
The system's invocation of Peircean semiotics is broadly appropriate but contains a significant terminological
error that reveals a deeper conceptual confusion. **The claim that "spatial proximity and connection weight
serve as indexical signs" is a partial misapplication of Peirce's framework.** Peirce's index requires an
*existential* or *causal* connection between sign and object — smoke indexing fire, a weathervane indexing
wind direction (CP 2.248, 2.299). Spatial proximity in a designed graph layout is not an existential fact of the
world; it is a designer's decision. The correct Peircean term is **diagrammatic iconicity** — a subtype of icon
where structural relationships within the sign mirror structural relationships among referents. Graph edges that
connect related nodes are closer to indexical (they direct attention), but the spatial clustering itself is iconicdiagrammatic, not indexical. This matters because indexical signs are processed more automatically than
diagrams, and overstating the naturalness of spatial encoding could lead designers to skip the training that
diagrammatic interpretation requires.
The icon-versus-symbol trade-off is well-studied and carries a clear lesson: **iconicity aids initial learnability, but
abstract concepts inevitably require conventional (symbolic) encoding.** Experimental semiotics research by
Galantucci (2005) and Fay et al. (2008) demonstrated that emergent sign systems in communication games
begin with high iconicity that decreases as conventions stabilize. Critically, Fay found that communitymaintained systems retain *more* iconicity than pair-developed ones, because iconic elements function as
shared mnemonics. [PubMed Central](https://pmc.ncbi.nlm.nih.gov/articles/PMC4503356/) For concepts like
"governance," "resonance," and "maturity," pure imagistic iconicity is impossible — there is no visual form of
governance. Peirce's three sub-types of icon provide a path forward: **diagrams** (structural resemblance) and
**metaphors** (cross-domain parallelism) can encode abstract relationships even when images cannot.
[Wikipedia](https://en.wikipedia.org/wiki/Semiotic_theory_of_Charles_Sanders_Peirce) A hierarchical glyph
arrangement could diagrammatically icon "governance" by mirroring authority structures, but this requires
explicit teaching — it will not be self-evident.
Saussure's contribution is equally relevant and often under-appreciated in design contexts. His principle of
**differential value** — that signs gain meaning through contrast with other signs in the system [Media Studies]
(https://media-studies.com/saussure/) — maps directly onto glyph design. A glyph for "growth" gains meaning
partly through its visual opposition to "decay." Kress and van Leeuwen's *Reading Images* (1996) extended
Saussurean analysis to visual composition, establishing paradigmatic relations (selection/contrast) and
syntagmatic relations (combination rules) as grammatical axes for visual texts. For Astral Script, this means the
paradigmatic inventory (which shapes, colors, and spatial positions contrast meaningfully?) must be designed as
a system of oppositions, not as isolated creative decisions.
Eco's framework offers perhaps the most practically useful guidance. His distinction between **overcoding**
(constraining interpretation through explicit rules) and **undercoding** (allowing approximate, tentative
interpretation) [ResearchGate]
(https://www.researchgate.net/publication/384276800_Overcoding_and_Undercoding_In_The_Topic_All_Eyes_on_Rafah_Research_on_BBC_maps precisely onto the tension between operational precision and expressive flexibility. For monitoring
functions where ambiguity could be dangerous, Codex Signum needs heavy overcoding — explicit rules mapping
luminance levels to system states. For the more expressive "Human-AI symbiotic communication" functions of
Astral Script, undercoding is acceptable and even desirable. Eco's concept of the **Model Reader** — the
interpretive competence a text presupposes — legitimizes the idea of different audiences reading the same glyph
differently. A novice Model Reader activates denotative codes; an expert Model Reader accesses connotative
and intertextual layers. This is not mere speculation; it describes how musical notation, chemical formulas, and
Chinese characters already function.
---
## Perceptual science supports some claims but demolishes others
The visual perception claims are where the analysis most urgently needs correction, because two central design
decisions rest on misreadings of the evidence.
**The feature hierarchy claim ("Luminance > Hue > Size > Shape > Orientation") is not established as a fixed
ranking.** Wolfe and Horowitz (2004, 2017) provided the most authoritative taxonomy of attention-guiding
features, classifying color (including luminance contrast) and motion as "undoubted" guiding attributes, with
shape as merely "probable." But they explicitly reject rigid ranking because feature effectiveness is contextdependent — it varies with target-distractor similarity, display conditions, and task demands. What IS supported:
luminance and color are among the most powerful pre-attentive features, and single-feature search produces
near-zero search slopes (**~0-5 ms/item** for color singletons versus **~25-60 ms/item** for conjunction
targets requiring both color AND shape identification, per Treisman and Gelade 1980). This validates using
luminance as a primary state channel, but the specific hierarchy should not be treated as a design rule.
**The claim that "pre-attentive luminance processing enables <200ms state detection" is partially supported but
conflates detection with identification.** Healey's review confirms that tasks performed on large multi-element
displays in under 200-250ms are considered pre-attentive, and single-feature pop-out searches show near-zero
set-size costs. However, total reaction time including sensory processing, decision, and motor response is
typically **400-600ms**, and Palmer et al. (2019) showed that even basic color guidance requires 200-300ms to
become fully effective. The <200ms figure describes the pre-attentive *detection* of a salient change, not the
conscious *identification* of what that change means for system state. A more accurate claim would be: "Preattentive luminance changes are detected within ~200ms, but state identification requires an additional ~200-
400ms of focal attention."
**The pulsation frequency recommendation of "8-15 Hz for critical alerts" is not just unsupported — it is actively
dangerous.** While SSVEP research does confirm that **8-15 Hz is the most perceptually salient flicker range**
(Kanai et al. 2006, Shady et al. 2004), this range overlaps almost perfectly with the peak epilepsy risk zone. The
Epilepsy Foundation identifies **5-30 Hz** as the most likely trigger range for photosensitive seizures, with peak
provocation at **15-20 Hz** — especially for red flashing (Parra et al. 2007). WCAG 2.3.1 mandates no more than
**3 flashes per second**. Section 508 prohibits flickering between 2-55 Hz. ISO 9241-391 harmonizes with these
standards. The design must use **0.5-3 Hz for all pulsation**, mapping urgency within this safe range (1 Hz =
low, 2 Hz = moderate, 3 Hz = critical). The 8-15 Hz recommendation should be abandoned entirely.
The complementary claim that "1-2 Hz pulsation conveys calming/heartbeat-like reassurance" is **weakly
supported**. Resting heart rate is 60-80 bpm (1.0-1.3 Hz), which may create an associative effect, but no peerreviewed study specifically validates this for visual display design. Warning signal research (Edworthy et al. 1991,
Patterson 1982) consistently shows that higher pulse rates increase perceived urgency, supporting a *relative*
mapping within the safe range, but the "calming heartbeat" association is design intuition, not established
science.
**The "8-10× higher effective coverage than text logs" claim has no empirical support whatsoever.** Extensive
searching across SCADA, process control, network monitoring, and cybersecurity operations center literature
found no study making this claim or providing a direct head-to-head comparison yielding this multiplier. The
closest relevant finding is Larkin and Simon's (1987) demonstration that diagrams can be computationally more
efficient than text for certain inference tasks, and an adaptive SIEM visualization study showing **42%
improvement** (1.42×, not 8-10×). Moody (2009) explicitly warns that "cognitive effectiveness is not an inherent
property of visual representations" — poorly designed visual displays can be worse than text. This claim should
be removed or replaced with task-specific empirical measurements.
---
## Working memory is 3-4 objects, not 7 — and this changes everything
The system's cognitive load assumptions need recalibration around a number that is half what many designers
assume. **Miller's "7±2" applies to verbal short-term memory; visual working memory capacity is approximately
3-4 integrated objects** (Luck and Vogel 1997, [Nature](https://www.nature.com/articles/36846) Cowan 2001).
This has profound implications for glyph monitoring. Operators cannot actively hold more than ~4 glyph states in
working memory simultaneously. For monitoring displays with dozens of glyphs, the system must rely on preattentive pop-out to flag state changes rather than expecting operators to maintain continuous awareness of all
elements.
The good news is that visual working memory stores **integrated objects, not individual features**. Vogel,
Woodman, and Luck (2001) showed that objects defined by conjunctions of four features (color + orientation +
size + gap) were retained as effectively as single-feature objects. This means a well-designed glyph encoding
state through multiple simultaneous channels (color = severity, luminance = activity, shape = type, pulsation =
trend) does not consume more working memory than a simple colored dot — as long as the features are bound
into a coherent perceptual object. This strongly favors the multi-channel glyph design, provided the channels are
integrated into unified perceptual objects rather than requiring separate attention to each feature.
Sweller's Cognitive Load Theory adds the **expertise reversal effect** — instructional designs effective for
novices become actively detrimental for experts. Kalyuga et al. (2003) demonstrated this with electrical
apprentices learning wiring diagrams: integrated text-in-diagram formats helped novices but harmed experts,
who performed better with diagrams alone. This scientifically validates the need for adaptive display complexity:
novice mode with explicit labels, guided attention, and simpler states; expert mode with denser information, less
redundancy, and more abstract representations. A single fixed display cannot optimally serve both populations.
Research also shows dashboard modules beyond **nine simultaneously displayed elements** overwhelm
operators, with eye-tracking confirming increased fixation durations and decreased accuracy. [ScienceDirect]
(https://www.sciencedirect.com/science/article/abs/pii/S0926580523002893)
---
## Multi-layered meaning works — but only 2-3 layers deep
The concept of multi-layered interpretation based on observer expertise is **well-validated across existing
systems**, but with a crucial constraint on depth. Musical notation operates on at least three layers: pitch and
duration for beginners, dynamics and articulation for intermediates, and expressive interpretation plus harmonic
analysis for experts. Chemical formulas reveal molecular composition, structural bonding, and three-dimensional
conformation to progressively expert readers. Chinese characters offer whole-character recognition, radical
decomposition revealing meaning categories, and etymological knowledge spanning millennia. [De Gruyter Brill]
(https://www.degruyterbrill.com/document/doi/10.1515/sem-2015-0134/html?lang=en) Nuclear semiotics — the
Sandia WIPP marker system for 10,000-year communication — independently derived a **four-level progressive
disclosure model**: rudimentary ("something man-made is here"), cautionary ("it is dangerous"), basic (what, why,
when, where), and complex (detailed records and diagrams). [HandWiki](https://handwiki.org/wiki/Physics:Longterm_nuclear_waste_warning_messages)
However, usability research consistently finds that **designs going beyond 2-3 simultaneous interpretation layers
have low usability** [Shopify](https://www.shopify.com/partners/blog/progressive-disclosure) (Nielsen Norman
Group, Shopify design guidelines). Users get lost navigating between levels. [Shopify]
(https://www.shopify.com/partners/blog/progressive-disclosure) The WIPP four-level system works because
levels are spatially separated (different physical locations at the marker site), not cognitively simultaneous. For
Astral Script and Codex Signum, the practical recommendation is two functional layers — operational
(denotative, overcoded) and interpretive (connotative, expert-accessible) — with a third reference layer available
through explicit interaction rather than perceptual parsing.
Pirolli and Card's **Information Foraging Theory** (1999) provides the theoretical mechanism: users follow
"information scent" — proximal visual cues that predict the value of distal content. [Nielsen Norman Group]
(https://www.nngroup.com/articles/information-foraging/) Strong scent enables efficient navigation; weak scent
leads to random, inefficient exploration. [CardSort](https://www.freecardsort.com/glossary/information-scent) In
a glyph system, this means each layer's visual cues must accurately predict what deeper investigation will reveal.
A pulsing red glyph (strong scent) should reliably lead to actionable critical information, not ambiguous
secondary data.
---
## Constructed visual languages have a 100% failure rate at universality
The historical record of constructed visual languages provides a sobering pattern that Astral Script must
confront. Arika Okrent's analysis of **900+ constructed languages** identified consistent failure modes:
[Mythsoc](https://www.mythsoc.org/reviews/in-the-land-of-invented-languages.htm) overreach (trying to encode
all human thought), resistance to community evolution, ego-driven control by creators, and failure to achieve
network effects. No constructed language has ever achieved universal adoption. [Meadow Party]
(https://meadowparty.com/blog/2015/08/09/in-the-land-of-invented-languages/)
**Blissymbolics** (Charles Bliss, 1949) — built from ~900 composable base elements [Wikipedia]
(https://en.wikipedia.org/wiki/Blissymbols) on a gridded matrix — failed as a universal language [Fandom]
(https://ial.fandom.com/wiki/Blissymbolics) because abstract concepts required arbitrary conventional
assignments that Bliss presented as self-evident but weren't. When the Ontario Crippled Children's Centre
adopted it, [Unicode](https://www.unicode.org/L2/L2023/23138-n5228-blissymbols.pdf) practitioners
interpreted symbols differently than intended, [Wikipedia](https://en.wikipedia.org/wiki/Charles_K._Bliss)
demonstrating Eco's undercoding in action. Bliss sued his own adopters. [Meadow Party]
(https://meadowparty.com/blog/2015/08/09/in-the-land-of-invented-languages/) [Wikipedia]
(https://en.wikipedia.org/wiki/Charles_K._Bliss) The system succeeded only in the narrow domain of AAC
(Augmentative and Alternative Communication), where [Fandom](https://ial.fandom.com/wiki/Blissymbolics)
heavy overcoding by trained facilitators constrains interpretation. [Fandom]
(https://ial.fandom.com/wiki/Blissymbolics) **Isotype** (Otto Neurath, 1930s) explicitly avoided claiming to be a
"language," calling itself a "language-like technique" and acknowledging pictures "can only show concrete,
tangible objects" and are "incapable of expressing abstract entities." **aUI** (John Weilgart, 1962) — 42 semantic
primitives with motivated symbols [Listverse](https://listverse.com/2015/04/17/10-attempts-to-create-an-idealuniversal-language/) — demonstrated that total motivation doesn't guarantee learnability; its compositional
opacity (building "cat" from "Together-Five-Part-Make-animal") made it harder to learn than natural language
equivalents.
The lesson is clear: **visual systems succeed as supplements to other communication modalities, not as
replacements.** Traffic signs, ISO safety symbols, musical notation, and emoji all work precisely because they
operate within constrained domains alongside verbal language. [Wikipedia]
(https://en.wikipedia.org/wiki/Isotype_(picture_language)) Astral Script should position itself similarly — as a
specialized monitoring and state-communication layer, not as a general-purpose language.
---
## The Halo aesthetic can work if every element encodes data
The tension between aesthetic richness and functional clarity is real but resolvable. Tufte's data-ink ratio
principle (1983) demands that every visual element encode data, eliminating "chartjunk." But Bateman et al.
(2010) demonstrated in controlled experiments that visually embellished charts showed **no significant
difference in immediate comprehension accuracy** compared to plain charts, and **significantly enhanced longterm memorability** after 2-3 weeks. Borkin et al. (2013) confirmed that unique visualization types and
recognizable visual elements improve chart recall.
The resolution: **make every aesthetic element carry semantic weight.** If glow intensity maps to system health,
halo color maps to state category, and energy-line density maps to throughput, these are data-ink by definition —
they encode information through the same channels that create the Halo aesthetic. This is not chartjunk but
redundant coding, which WCAG and accessibility research actually recommend (never rely on a single channel).
The danger is the opposite case: purely decorative glows, particles, and energy effects that compete for
attentional resources without encoding meaning. Stephen Few's dashboard research finds that vendors who
prioritize "flash and dazzle" consistently subvert clear communication. For safety-critical monitoring, **every
photon must earn its place by encoding state.**
The specific claim that "aesthetic principles can encode grammatical distinctions" has **no direct precedent** in
the literature. No existing visual language uses luminosity, energy, or glow properties as grammatical markers
(analogous to verb tense or number agreement in spoken language). Color-coding categorical distinctions is
well-established in visualization (Gestalt similarity principle), and animation properties are pre-attentively
processed. But calling these "grammar" stretches the concept beyond its established meaning. A more
defensible framing: aesthetic properties can encode **semantic dimensions** (state, severity, trend, category)
through consistent mapping, which is well-supported. Calling this "grammar" adds confusion without adding
function.
---
## Gestalt principles validate graph topology but Arnheim's balance theory does not
Gestalt laws provide robust perceptual support for using spatial arrangement as a meaning carrier.
**Connectedness** (elements linked by lines perceived as grouped) is the strongest available grouping
mechanism — stronger than proximity and similarity combined. **Common fate** (synchronized motion creating
grouping) is directly relevant: glyphs representing related services that pulse in synchrony will be perceived as a
unit even if spatially separated, making this one of the most powerful encoding channels available for showing
system relationships. **Proximity** communicates relatedness, and **continuity** supports edge-following in
graph layouts — edges with fewer bends are more easily traced.
However, the application of Arnheim's visual dynamics to signal system instability is **theoretically appealing but
empirically unproven**. Arnheim's *Art and Visual Perception* (1954/1974) predicts that visual imbalance
creates a perception of transience and instability — suggesting that deliberately unbalanced glyph arrangements
could viscerally communicate "something is wrong." McManus, Stöver, and Kim (2011) tested this directly and
found **no robust support for the physicalist interpretation** of Arnheim's balance theory. Viewers can perceive
subtle differences in visual weight distribution, but this has been demonstrated only in aesthetic judgment tasks,
not in monitoring or performance contexts. Using visual imbalance as a functional encoding strategy remains
speculative.
Endsley's Situation Awareness model maps well onto the three-tier design. **Level 1 SA** (perception) is
supported through pre-attentive pop-out — a single glyph changing luminance will be detected without serial
search, provided the change is in a single pre-attentive feature [Ncsu]
(https://www.csc2.ncsu.edu/faculty/healey/PP/) and the operator's cognitive load is not excessive. **Level 2
SA** (comprehension) is supported through graph topology — the Gestalt literature on graph drawing confirms
that spatial arrangement communicates relational structure (isolated failure versus cascade). **Level 3 SA**
(projection) is the weakest link — using increasing pulsation rate to predict imminent failure is plausible but
unvalidated. No study has tested whether operators can reliably use dynamic visual properties to project future
system states.
---
## Moody's nine principles provide the missing design framework
Daniel Moody's "Physics of Notations" (2009, IEEE Transactions on Software Engineering) offers the most
comprehensive evidence-based framework for evaluating visual notation designs, based on nine principles
distilled from cognitive science: [IEEE Xplore](https://ieeexplore.ieee.org/document/5353439/)
- **Semiotic clarity** requires 1:1 correspondence between symbols and concepts — no symbol should represent
multiple meanings (overload) or be represented by multiple symbols (redundancy)
- **Perceptual discriminability** demands that glyphs be clearly distinguishable, with CIELAB ΔE > 20 between
colors and luminance contrast ratios exceeding 4.5:1
- **Semantic transparency** calls for symbols that suggest their meaning through appearance — but
acknowledges this is impossible for abstract concepts and requires convention
- **Complexity management** mandates mechanisms for handling diagram complexity (hierarchical nesting,
semantic zooming, filtering)
- **Visual expressiveness** requires using the full range of visual variables (Bertin's seven: position, size,
brightness, color, texture, shape, orientation)
- **Dual coding** recommends text complementing graphics — relevant because the system should never rely
solely on glyphs without textual anchoring
- **Graphic economy** limits the number of distinct symbol types to a cognitively manageable set
- **Cognitive fit** requires adapting representations to audience expertise — directly aligning with the expertise
reversal effect
Bertin's *Sémiologie Graphique* (1983) established the seven visual variables as the foundation of graphic
information encoding. A glyph using six independent channels (color, size, shape, luminance, orientation,
pulsation rate) could theoretically encode **~4-8 bits per glyph** — approximately 6-8 discriminable levels of hue
(2.6-3 bits), 5-7 levels of size (2.3-2.8 bits), 15-24 shapes (3.9-4.6 bits), 6-8 brightness levels (2.6-3 bits), 4-8
orientations (2-3 bits), and 3-4 pulsation rates (1.6-2 bits). But cross-dimensional interference means these
channels are not fully independent, and practical discriminability under monitoring conditions (peripheral vision,
divided attention, fatigue) reduces capacity significantly. No peer-reviewed study has empirically measured bits
per glyph for monitoring applications.
---
## A recommended validation protocol grounded in established methods
The system needs empirical validation before any performance claims can be made. The following protocol
integrates ISO standards, Signal Detection Theory, and NASA-TLX:
**Phase 1 — Symbol comprehension (ISO 9186-adapted):** Present each core glyph to ≥50 respondents across
≥3 countries. Use open-ended interpretation ("What does this symbol mean?"). Three independent judges classify
responses. [iteh](https://cdn.standards.iteh.ai/samples/59226/10ccdf51569a4aeb87e0b42671a6c0e9/ISO9186-1-2014.pdf) Accept glyphs achieving ≥67% correct comprehension (ISO 7001 threshold) [Grokipedia]
(https://grokipedia.com/page/ISO_7001) or ≥85% (ANSI Z535.3 threshold). [Scriptiebank]
(https://scriptiebank.be/file/9261/download?token=Eh2uKHM1) Iteratively redesign failing glyphs.
**Phase 2 — Pre-attentive discriminability:** Measure reaction time for detecting target glyph states among
distractors as a function of set size. Flat RT × set-size slope confirms pre-attentive processing. Target: <250ms
detection for critical state changes via luminance/color channels. Test conjunction interference to ensure multichannel encodings do not create serial search requirements.
**Phase 3 — Monitoring performance:** Simulate monitoring tasks with programmed anomalies at varying rates.
Compute d-prime (signal detection sensitivity), response time distributions, miss rates, and false alarm rates.
[Cgu](https://wise.cgu.edu/wise-tutorials/tutorial-signal-detection-theory/signal-detection-d-defined-2/)
Administer NASA-TLX subscales separately (per Bolton et al. 2023 critique of composite scores). Include a textlog baseline condition for direct comparison. Run 30-60 minute sessions to measure vigilance decrement curves.
**Phase 4 — Longitudinal learning:** Track performance over 2-4 weeks of regular use. Test retention after 1-
week gap. Compare novice versus expert trajectories at multiple time points. Measure transfer effects to
extended symbol sets.
---
## Conclusion: half science, half aspiration — and a clear path forward
The Astral Script and Codex Signum designs rest on a foundation with genuine structural integrity in some areas
and dangerous gaps in others. **Three claims are well-grounded**: modular composition from geometric
primitives (validated by 3,000 years of Chinese character use), luminance-based pre-attentive state detection
[ncsu](https://www.csc2.ncsu.edu/faculty/healey/PP/) (Treisman's FIT, [Psychology Fanatic]
(https://psychologyfanatic.com/feature-integration-theory/) search slopes near 0 ms/item), and multi-layered
interpretation based on expertise (demonstrated in musical notation, chemical formulas, and nuclear semiotics).
**Three claims require immediate correction**: the 8-15 Hz pulsation range must be replaced with 0.5-3 Hz
(epilepsy safety), the "8-10× monitoring advantage" must be removed (no evidence exists), and "spatial proximity
as indexical" should be reframed as "diagrammatic iconicity" to accurately reflect what the design actually
achieves. **Two claims remain genuinely novel and unvalidated**: aesthetic properties as grammatical encoding
and AI-mediated vocabulary management for humans learning a core subset. Neither is implausible, but both
require the empirical validation protocol outlined above before any performance claims are defensible.
The deepest lesson from the historical record is that constructed visual languages succeed as **specialized
supplements** and fail as **universal replacements.** Isotype worked for statistical display because Neurath
honestly called it a "language-like technique" and never claimed it could express abstract propositions.
[Wikipedia](https://en.wikipedia.org/wiki/Isotype_(picture_language)) [New Statesman]
(https://www.newstatesman.com/culture/2019/10/lessons-epic-quest-blissymbolics-universal-written-language)
Blissymbolics survived only in the constrained AAC domain [Fandom]
(https://ial.fandom.com/wiki/Blissymbolics) where trained facilitators overcoded every interaction. [Letterform
Archive](https://letterformarchive.org/news/blissymbolics/) The systems that endure — traffic signs, musical
notation, chemical formulas, Chinese characters — all operate within constrained domains alongside natural
language, supported by institutional standardization and communities of practice that allow organic evolution.
Astral Script and Codex Signum should be designed, validated, and positioned with this hard-won historical
wisdom firmly in view.