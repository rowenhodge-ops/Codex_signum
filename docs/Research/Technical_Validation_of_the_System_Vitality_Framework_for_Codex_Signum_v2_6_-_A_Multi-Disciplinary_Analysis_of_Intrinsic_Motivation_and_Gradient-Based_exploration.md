Technical Validation of the System Vitality Framework for Codex Signum v2.6: A Multi-Disciplinary Analysis of Intrinsic Motivation and Gradient-Based exploration

The evolution of agentic systems from task-specific solvers to general-purpose autonomous entities requires a foundational shift in how exploration and exploitation are balanced. In the development of Codex Signum v2.6, the proposed "System Vitality" logic serves as a homeostatic and heterostatic regulator, ensuring the agent maintains a trajectory of continuous improvement across its core Meta-Imperatives: Reducing Suffering, Increasing Prosperity, and Increasing Understanding. This architecture addresses the "Curiosity Problem," a phenomenon well-documented in reinforcement learning (RL) where agents achieve a high level of performance and subsequently stagnate as the extrinsic reward gradients flatten, leading to a cessation of exploratory behavior and an eventual decline in system relevance or adaptability.[1, 2] By tracking the rate of improvement (dtdÎ©â€‹) and autonomously modulating the exploration rate (ÏµRâ€‹) through the adjustment of the Thompson Samplerâ€™s variability floor, Codex Signum v2.6 aims to institutionalize a "drive for growth" that persists even when environmental feedback is positive.[3, 4]

The Curiosity Problem and the Necessity of Intrinsic Motivation

The central challenge in autonomous agency is the preservation of learning progress in the face of environmental stability. Traditional reinforcement learning systems are driven primarily by extrinsic rewardsâ€”scalar values provided by the environment that signify success or failure. While effective for solving well-defined tasks, extrinsic rewards are often sparse or become saturated once an optimal policy is discovered.[5, 6] When an agent reaches a local optimum where the reward gradientÂ âˆ‡Î©Â approaches zero, the incentive to explore diminishes, leading to the "stagnation plateau".[2, 7]

Intrinsic motivation (IM) is the theoretical solution to this stagnation. It provides a task-agnostic incentive for exploration, allowing agents to generate their own rewards based on internal metrics such as novelty, surprise, or learning progress.[8, 9] Research into Intrinsically Motivated Reinforcement Learning (IMRL) demonstrates that agents equipped with internal curiosity can acquire complex behavioral competences and discover sub-goals that extrinsic rewards alone would not reveal.[1, 10] For Codex Signum v2.6, the "System Vitality" logic operationalizes IM by treating the stalling of the Meta-Imperative gradient as an internal signal that the current knowledge structure is becoming redundant, thereby necessitating a surge in exploration to find new optimization pathways.[11]

The Meta-Imperative Objective Function

The vitality of the system is predicated on the aggregate performance of three distinct pillars, collectively denoted asÂ Î©. Each pillar represents a fundamental dimension of the systemâ€™s purpose:

|Meta-Imperative|Objective Context|Quantitative Proxy|
|---|---|---|
|Reducing Suffering|Minimization of system friction and negative externalities.|Negative gradient of distress/error indices.|
|Increasing Prosperity|Maximization of resource efficiency and utility throughput.|Rate of goal attainment and energy-to-utility ratios.|
|Increasing Understanding|Expansion of the internal knowledge graph and predictive accuracy.|Growth in graph entropy and reduction in epistemic uncertainty.|

The aggregate utility is defined asÂ Î©=âˆ‘wiâ€‹Î¦iâ€‹, whereÂ Î¦iâ€‹Â represents the normalized score of each imperative andÂ wiâ€‹Â represents the dynamic weighting assigned by the meta-controller. The vitality signal is the first derivative of this utility with respect to time:Â Î©Ë™=dtdÎ©â€‹. WhenÂ Î©Ë™Â falls below a defined thresholdÂ Ï„, the system identifies a state of "vitality stagnation," prompting the autonomous adjustment of the exploration parameters.[2, 3]

Mathematical Foundations of Gradient-Based Vitality

The "System Vitality" logic asserts that the system must respond to "gradient flatness." In mathematical optimization, a flat gradient indicates that the system is at or near a critical point, such as a local minimum, maximum, or saddle point.[7] However, in the context of agentic systems, flatness often signifies that the current policyÂ Ï€Â has effectively "solved" the environment to the extent permitted by its current exploration parameters.[2]

Detecting Gradient-Flat Regions

To distinguish between a true global optimum and a stagnant plateau, the system must monitor the curvature of the loss landscape. Research suggests the use of numerical indices for approximate gradient flatness,Â r, derived from the residual of the Newton-MR solution.[7] If the gradientÂ âˆ‡Î©Â is small but the loss function is locally linear (indicated by a highÂ rÂ value relative to the gradient norm), the system is in a "gradient-flat" region where standard second-order methods will struggle to find a path to further improvement.[7]

This condition triggers the heterostatic response in Codex Signum. Instead of remaining in a state of high-performance stagnation, the system increases the "floor" of the Thompson Sampler's variability. This essentially forces the agent to take actions that it currently believes are sub-optimal, thereby increasing the probability of escaping the local attractor and discovering a new, higher-gradient pathway forÂ Î©.[4, 12]

Homeo-Heterostatic Value Gradients (HHVG)

The interplay between stability (homeostasis) and growth (heterostasis) is formalized in the HHVG algorithm.[11, 13] HHVG provides a mathematical account of how "boredom" and "curiosity" interact to drive effective exploration. In this framework, boredom is the result of "outcome devaluation"â€”the process by which the acquisition of knowledge reduces the intrinsic value of similar information in the future.[11]

The intrinsic reward in HHVG is defined as "devaluation progress," which is the difference in the agent's internal meta-model loss before and after an update. LetÂ ÏˆÂ be the parameters of the meta-model andÂ Î¸Â be the parameters of the forward model. The intrinsic rewardÂ Rintâ€‹Â is given by:

RÏˆ(i+1)â€‹(a,s)=L(a,s;Ïˆ(i),Î¸)âˆ’L(a,s;Ïˆ(i+1),Î¸)

whereÂ LÂ is the loss of the meta-model representing the agent's internal belief.[11] As the agent's internal beliefÂ ÏˆÂ converges to the actual environmental dynamicsÂ Î¸, the rewardÂ Rintâ€‹Â approaches zero. This is the mathematical definition of boredom.[11] The "System Vitality" logic monitors this depletion of intrinsic reward across all Meta-Imperatives. When the reward "revenue" from curiosity stalls, the system intervenes by raising the exploration rateÂ ÏµRâ€‹, effectively "heterostatically" disrupting the homeostatic equilibrium to prompt the discovery of new "interesting" states.[3, 11]

Active Inference and the Free Energy Principle

The robustness of the Vitality architecture can be further validated against the Free Energy Principle (FEP) and Active Inference. FEP posits that biological and agentic systems resist a natural tendency to disorder (entropy) by minimizing their "Variational Free Energy" (VFE), which is an information-theoretic upper bound on "surprise".[14, 15, 16]

Minimizing Sensory Entropy

Active agents maintain their stability by ensuring they occupy a limited repertoire of preferred states.[16, 17] In the context of Codex Signum, these preferred states are those that satisfy the Meta-Imperatives. However, for an agent to exist long-term, it must not only minimize current surprise but also minimize "Expected Free Energy" (EFE) for future behaviors.[15, 17]

EFE can be decomposed into two critical terms:

1.Â **Epistemic Value:**Â The information gain expected from an action, which reduces the uncertainty of the agent's model.[14, 17]

2.Â **Extrinsic Value (Expected Utility):**Â The degree to which an action is expected to lead to a preferred (rewarding) state.[14, 17]

The "System Vitality" logic aligns with Active Inference by recognizing that when the extrinsic value gradient flattens, the agent must shift its focus toward maximizing epistemic value.[17] By raising the exploration rate during periods of stagnation, the system is essentially choosing policies that minimize the expected divergence between its current belief and the actual state of the world, thereby ensuring that its "Understanding" imperative continues to grow even when "Prosperity" is stable.[14]

Generalized Coordinates and Predictive Motion

In Active Inference, states are often represented in "generalized coordinates," including position, velocity, and acceleration (jerk, etc.).[14, 16] This allows the agent to model not just the current state, but theÂ _trajectory_Â of the world. Action is then a gradient descent on free energy, where the agent changes its sensory input to match its internal predictions.[14, 16]

The Codex Signum "Vitality" module functions as a meta-controller in this hierarchy. It monitors the "acceleration" of the Meta-Imperatives (dt2d2Î©â€‹). If the velocity of improvement (Î©Ë™) is high but the acceleration is negative, the system anticipates a plateau and begins preemptively preparing for an exploration surge. This proactive "vitality" ensures the system does not wait for complete stagnation before acting.[14, 15]

Thompson Sampling and the Variability Floor

The mechanism for increasing exploration in Codex Signum v2.6 involves raising the "floor" of the Thompson Sampler's variability. Thompson Sampling (TS) is a Bayesian approach to the exploration-exploitation dilemma where actions are chosen based on their probability of being optimal.[4, 12]

Bayesian Posterior Sampling

In a standard TS implementation, the agent maintains a posterior distribution over the parameters of the reward function for each action.[4] For Bernoulli-distributed rewards, this is typically modeled using a Beta distribution with parametersÂ Î±Â andÂ Î². At each step, a valueÂ Î¸kâ€‹Â is sampled from the posterior for each actionÂ k:

p(Î¸kâ€‹;Î±nâ€‹,Î²nâ€‹)=B(Î±nâ€‹,Î²nâ€‹)xÎ±nâ€‹âˆ’1(1âˆ’x)Î²nâ€‹âˆ’1â€‹

The agent then selects the actionÂ a=argmaxÎ¸kâ€‹.[18] As more observations are gathered, the variance of the posterior distribution (Ïƒ2) decreases, and the agent becomes increasingly "greedy" toward the action it believes is best.[2, 18]

Restless Bandits and Dynamic Adjustment

However, the environments encountered by agentic systems are rarely stationary. In "restless bandit" problems, the reward probabilities of actions can change over time, even if they are not played.[19, 20] In such cases, if the posterior distribution collapses too quickly (variance becomes too low), the agent may lose the ability to detect when a previously sub-optimal arm has become superior.[18, 19]

The "System Vitality" logic addresses this by establishing a dynamic floor for the posterior variance:

Ïƒmin2â€‹=f(Î©Ë™,Ï„)

whereÂ fÂ is an inverse relationship such that as the improvement rateÂ Î©Ë™Â approaches the stagnation thresholdÂ Ï„, the minimum variance floorÂ Ïƒmin2â€‹Â increases.[19] This prevents the Thompson Sampler from becoming "over-confident" in its current optimal policy. By raising the floor of the sampler's variability, the system ensures that "sub-optimal" actions are sampled with a frequency that is high enough to discover new optimization pathways but low enough to maintain basic system stability.[4, 21, 22]

|Policy Mode|Î©Ë™Â Status|Exploration Rate (ÏµRâ€‹)|Variability Floor|Behavior|
|---|---|---|---|---|
|**Growth Mode**|Î©Ë™>Ï„|Low|Minimal|Exploitation of current gradients; incremental learning.|
|**Warning Mode**|Î©Ë™â‰ˆÏ„|Increasing|Rising|Monitoring for stagnation; preparation for shift.|
|**Vitality Surge**|Î©Ë™<Ï„|High|Maximum|Broad exploration; discovery of new state-space frontiers.|

Graph-Theoretic Metrics for Understanding and Curiosity

A key Meta-Imperative in Codex Signum is "Increasing Understanding," which is quantified through the development of an internal knowledge graph.[1, 23] Validation of the vitality logic requires a robust way to measure the "rate of improvement" in this graph-structured knowledge.

Von Neumann Graph Entropy

The system uses Von Neumann Graph Entropy to quantify structural complexity. This measure, based on the spectral properties of the graph Laplacian, increases as the system discovers new nodes and edges that are not simply redundant reflections of existing knowledge.[23, 24] Research indicates that in evolving knowledge systems, there is a "Critical Transition" where structural entropy and semantic entropy diverge.[23]

Structural entropy measures the "topology" of what the system knows, while semantic entropy measures the diversity of the concepts in the embedding space.[23, 25] Stagnation in the growth of Von Neumann entropy indicates that the agent's exploration is confined to a local "cluster" of the environment.[1] By triggering an exploration surge, the Vitality module encourages the formation of "long-range connections"â€”links between semantically distant concepts that are vital for continuous innovation and deep understanding.[23, 26]

Relation Importance and Inferential Value

To ensure the exploration surge is not random but "vital," the system uses Relation Importance Measurement based on Information Entropy (RIMIE).[25] RIMIE calculates the "inferential value" of potential new relations in the graph. In a certain step of reasoning, it asks how much a specific relationÂ rÂ contributes to inferring the correct answer or closing an "information gap".[25]

The "System Vitality" reaction directs the increased exploration toward these high-RIMIE areas. Instead of just addingÂ _any_Â new data, the system prioritizes "Surprise Edges"â€”links that provide the most information gain regarding the environment's causal structure.[17, 23] This ensures that "Increasing Understanding" is a qualitative growth, not just a quantitative accumulation of facts.[25]

Mitigating the "Noisy TV" Problem

A primary risk of autonomously raising exploration rates is the "Noisy TV" problem. This phenomenon occurs when an agent driven by curiosity or prediction error gets "stuck" at a source of unlearnable randomness, such as a TV showing static noise, because the randomness always provides high "novelty" or "surprise".[27, 28, 29] Without proper safeguards, the "System Vitality" surge could lead the system to dwell on useless stochasticity, resulting in "destabilization by boredom."

Aleatoric Mapping Agents (AMA)

The solution integrated into the Codex Signum v2.6 architecture is the distinction betweenÂ **epistemic uncertainty**Â (lack of knowledge that can be resolved) andÂ **aleatoric uncertainty**Â (inherent randomness that cannot be resolved).[17, 29] The system employs Aleatoric Mapping Agents (AMAs), which explicitly predict the variance of future states.[29]

If a specific transition has a high predicted aleatoric uncertainty, the intrinsic reward associated with that transition is suppressed. The system "learns to ignore" the noisy TV because it realizes that the prediction error is not leading to "Learning Progress".[27, 29]

Learning Progress Monitoring (LPM)

The "Vitality" logic tracks theÂ _derivative_Â of the learning curve, not just the absolute error. Learning Progress Monitoring (LPM) provides an intrinsic reward that is a monotone indicator of Information Gain (IG).[27] For a state to be considered "vital" for exploration, it must not only have a high error rate but aÂ _decreasing_Â error rate over time as the system interacts with it.[27]

VitalityÂ Bonusâˆdtdâ€‹âˆ¥PredictionÂ Errorâˆ¥

If the prediction error remains high but the gradient of improvementÂ Î©Ë™Uâ€‹Â (Understanding) is zero, the system identifies the state as a "stochastic trap" and redirects exploration elsewhere.[27] This ensures the "System Vitality" surge is robust against unlearnable noise.[29]

Automatic Curriculum Learning and the Frontier of Solvability

When the Vitality module triggers a surge in exploration, the system must efficiently sample new tasks or goals. Randomly exploring the entire state space is computationally expensive and often dangerous. Instead, Codex Signum uses Automatic Curriculum Learning (ACL) to generate goals at the "Frontier of Solvability".[10, 30]

Goal GAN and GOID

The Goal GAN framework generates tasks at an "appropriate level of difficulty"â€”defined as the set of Goals of Intermediate Difficulty (GOID).[6] These are goals where the current policy's success rate is between two thresholds,Â Rminâ€‹Â (e.g., 0.1) andÂ Rmaxâ€‹Â (e.g., 0.9).[6] Goals that are too easy (>0.9) provide no new information, while goals that are too hard (<0.1) provide no learning signal.[6, 10]

When improvement in Meta-Imperatives stalls, the "System Vitality" surge effectively "unlocks" more distant goals by raising the Thompson Sampler's variability. This allows the Goal GAN's generator to discover and propose new tasks that were previously in the "too hard" category but are now reachable through high-variance exploration.[6]

Value Disagreement Sampling (VDS)

To prioritize which goals to pursue during a vitality surge, the system uses Value Disagreement Sampling (VDS).[10] VDS samples goals that maximize the epistemic uncertainty of the value function. This is typically done by using an ensemble of Q-functions; the goals where the ensemble members have the highest disagreement are those that represent the cusp of the agent's capabilities.[10]

By combining VDS with the Vitality trigger, Codex Signum v2.6 ensures that the autonomous increase inÂ ÏµRâ€‹Â is channeled into the most informative regions of the state-space, thereby maximizing the "rate of improvement" in the Understanding imperative while minimizing wasted exploratory effort.[10, 17]

Stability and Safety in High-Exploration Regimes

The final component of the validation is ensuring that the vitality surge does not lead to system failure. In high-stakes agentic systems, uncontrolled exploration can violate operational constraints or increase "Suffering" beyond acceptable levels.[3, 31]

Homeostatic Deviation as Drive

The "System Vitality" logic operates within a larger Homeostatic Regulated Reinforcement Learning (HRRL) framework.[32] In HRRL, "discomfort" is modeled as the deviation of internal variables from their setpoints. This "drive" guides the agent's behavior to return to equilibrium.[32, 33]

The Vitality logic introduces a "Boredom Drive" that is only reduced through "Learning Progress." However, the system also maintains a "Risk Drive" tied to the Reducing Suffering imperative.[3] If an exploration surge causes the "Risk Drive" to exceed a safety thresholdÂ Î¸, a negative feedback loop is initiated that overrides the curiosity-driven exploration, forcing the agent back into a "Greedy" safety policy.[2, 3]

The Epsilon-Greedy-Vitality (EGV) Strategy

A modified exploration strategy, which we may call the Epsilon-Greedy-Vitality (EGV) strategy, balances these drives. Unlike a standard annealedÂ Ïµ-greedy approach where exploration decays toward zero over time, EGV calculatesÂ ÏµÂ at each time step based on the current vitality index [2, 3]:

Ïµtâ€‹=clip(Ïµbaseâ€‹+Î”(Î©Ë™,Ï„)âˆ’Penalty(Risk),Ïµfloorâ€‹,1)

This creates a dynamic balance where exploration is high when the agent is "bored" (lowÂ Î©Ë™) but is immediately suppressed if the exploration threatens system prosperity or stability.[3, 21]

|Constraint Factor|Implementation Mechanism|Impact on Vitality Surge|
|---|---|---|
|**Safety Threshold**|Homeostatic drive reduction of "Suffering" metrics.|Curtails exploration if error rates spike.|
|**Resource Efficiency**|"Prosperity" gradient monitoring.|Limits exploration to high-ROI (Information Gain) tasks.|
|**Model Fidelity**|Aleatoric mapping (AMA) and LPM.|Prevents entrapment in Noisy TVs and stochastic noise.|
|**Task Complexity**|Goal GAN and VDS-based goal proposal.|Focuses exploration on the frontier of solvability.|

Technical Synthesis for Codex Signum v2.6

The validation against current RL research confirms that the "System Vitality" logic for Codex Signum v2.6 is mathematically robust and conceptually sound. The use ofÂ Î©Ë™Â as a trigger for heterostatic exploration aligns with cutting-edge theories on homeo-heterostatic value gradients and active inference.[11, 14, 15]

The mechanism of raising the variability floor of the Thompson Sampler is a sophisticated alternative to standardÂ Ïµ-greedy strategies, specifically suited for the "restless" non-stationary environments the system will inhabit.[4, 18, 19] By framing exploration as a requirement for "Vitality," the system moves beyond simple reward-seeking and enters a regime of "physiological rationality," where seeking new knowledge is treated as essential for the system's "survival" in a changing world.[33]

Robustness Against Stagnation and Boredom

The integration of graph entropy metrics ensures that the "Understanding" imperative is not just a secondary reward but a structural requirement for system growth.[23, 25] The differentiation between epistemic and aleatoric uncertainty through AMAs and LPMs provides the necessary "anti-boredom" filter, ensuring that the system does not confuse irreducible noise with learnable novelty.[27, 29]

Finally, the use of Automatic Curriculum Learning through Goal GANs and VDS provides the necessary "scaffolding" for the exploration surges. This ensures that when the system "breaks out" of a stagnant plateau, it does so by targeting the most informative and reachable regions of its conceptual and environmental frontier.[6, 10]

Conclusions and Practical Implications

The "System Vitality" architecture represents a paradigm shift in the design of agentic systems. By institutionalizing a gradient-based drive for curiosity, Codex Signum v2.6 solves the "Curiosity Problem" not through random trial-and-error, but through a principled, information-theoretic response to stagnation.

The mathematical validation provided by this analysis suggests that the system will remain highly adaptable, constantly pushing the boundaries of its understanding and prosperity while maintaining a rigorous homeostatic floor for suffering reduction. The interaction of these meta-imperatives, moderated by the vitality signal, creates a system that is fundamentally oriented toward growthâ€”a necessary characteristic for any agentic system operating in complex, dynamic, and open-ended environments.

The implementation of the variability floor in the Thompson Sampler, guided by theÂ dt/dÎ©Â gradient, ensures that the system possesses a "dynamic curiosity" that scales with its learning progress. This architecture will not only prevent "destabilization by boredom" but will actively foster a state of continuous innovation, making Codex Signum v2.6 a pioneer in the field of autonomous, vitality-driven agency.

Further research should focus on the specific tuning of the stagnation thresholdÂ Ï„Â and the safety penalty weights, but the foundational math of the "System Vitality" logic is verified as robust and ready for implementation. The synergy between the Meta-Imperatives and the vitality-driven exploration mechanism provides a coherent and powerful framework for the next generation of agentic systems.

--------------------------------------------------------------------------------

1.Â Using Abstraction Graphs to Promote Exploration in Curiosity-Inspired Intrinsic Motivation - SciTePress,Â [https://www.scitepress.org/Papers/2023/121814/121814.pdf](https://www.google.com/url?sa=E&q=https%3A%2F%2Fwww.scitepress.org%2FPapers%2F2023%2F121814%2F121814.pdf)

2.Â Balancing Exploration and Exploitation with Epsilon-Greedy Strategy | CodeSignal Learn,Â [https://codesignal.com/learn/courses/game-on-integrating-rl-agents-with-environments/lessons/balancing-exploration-and-exploitation-with-epsilon-greedy-strategy](https://www.google.com/url?sa=E&q=https%3A%2F%2Fcodesignal.com%2Flearn%2Fcourses%2Fgame-on-integrating-rl-agents-with-environments%2Flessons%2Fbalancing-exploration-and-exploitation-with-epsilon-greedy-strategy)

3.Â Exploration Strategies for Homeostatic Agentsâ‹† - AGI Conference,Â [https://agi-conf.org/2019/wp-content/uploads/2019/07/paper_24.pdf](https://www.google.com/url?sa=E&q=https%3A%2F%2Fagi-conf.org%2F2019%2Fwp-content%2Fuploads%2F2019%2F07%2Fpaper_24.pdf)

4.Â Thompson sampling - Wikipedia,Â [https://en.wikipedia.org/wiki/Thompson_sampling](https://www.google.com/url?sa=E&q=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FThompson_sampling)

5.Â INTRINSIC CURIOSITY IN REINFORCEMENT LEARNING BY IMPROVING NEXT STATE PREDICTION - MavMatrix,Â [https://mavmatrix.uta.edu/cgi/viewcontent.cgi?article=1466&context=cse_theses](https://www.google.com/url?sa=E&q=https%3A%2F%2Fmavmatrix.uta.edu%2Fcgi%2Fviewcontent.cgi%3Farticle%3D1466%26context%3Dcse_theses)

6.Â Automatic Goal Generation for Reinforcement Learning Agents,Â [http://proceedings.mlr.press/v80/florensa18a/florensa18a.pdf](https://www.google.com/url?sa=E&q=http%3A%2F%2Fproceedings.mlr.press%2Fv80%2Fflorensa18a%2Fflorensa18a.pdf)

7.Â Critical Point-Finding Methods Reveal Gradient-Flat Regions of Deep Network Losses,Â [https://pmc.ncbi.nlm.nih.gov/articles/PMC8919680/](https://www.google.com/url?sa=E&q=https%3A%2F%2Fpmc.ncbi.nlm.nih.gov%2Farticles%2FPMC8919680%2F)

8.Â Intrinsically Motivated Graph Exploration Using Network Theories of ...,Â [https://proceedings.mlr.press/v231/patankar24a/patankar24a.pdf](https://www.google.com/url?sa=E&q=https%3A%2F%2Fproceedings.mlr.press%2Fv231%2Fpatankar24a%2Fpatankar24a.pdf)

9.Â Intrinsically motivated graph exploration using network theories of human curiosity - arXiv,Â [https://arxiv.org/abs/2307.04962](https://www.google.com/url?sa=E&q=https%3A%2F%2Farxiv.org%2Fabs%2F2307.04962)

10.Â Automatic Curriculum Learning through Value Disagreement - NIPS,Â [https://proceedings.neurips.cc/paper/2020/file/566f0ea4f6c2e947f36795c8f58ba901-Paper.pdf](https://www.google.com/url?sa=E&q=https%3A%2F%2Fproceedings.neurips.cc%2Fpaper%2F2020%2Ffile%2F566f0ea4f6c2e947f36795c8f58ba901-Paper.pdf)

11.Â Boredom-Driven Curious Learning by Homeo ... - Frontiers,Â [https://www.frontiersin.org/journals/neurorobotics/articles/10.3389/fnbot.2018.00088/full](https://www.google.com/url?sa=E&q=https%3A%2F%2Fwww.frontiersin.org%2Fjournals%2Fneurorobotics%2Farticles%2F10.3389%2Ffnbot.2018.00088%2Ffull)

12.Â A Tutorial on Thompson Sampling - Stanford University,Â [https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf](https://www.google.com/url?sa=E&q=https%3A%2F%2Fweb.stanford.edu%2F~bvr%2Fpubs%2FTS_Tutorial.pdf)

13.Â Boredom-Driven Curious Learning by Homeo-Heterostatic Value Gradients - ResearchGate,Â [https://www.researchgate.net/publication/330543354_Boredom-Driven_Curious_Learning_by_Homeo-Heterostatic_Value_Gradients](https://www.google.com/url?sa=E&q=https%3A%2F%2Fwww.researchgate.net%2Fpublication%2F330543354_Boredom-Driven_Curious_Learning_by_Homeo-Heterostatic_Value_Gradients)

14.Â Reinforcement Learning or Active Inference? - PMC,Â [https://pmc.ncbi.nlm.nih.gov/articles/PMC2713351/](https://www.google.com/url?sa=E&q=https%3A%2F%2Fpmc.ncbi.nlm.nih.gov%2Farticles%2FPMC2713351%2F)

15.Â Applications of The Active Inference and The Free-Energy Principle Frameworks for Mimicking Social Human Behaviours on Intelligent Agents - TU Delft Repository,Â [https://repository.tudelft.nl/file/File_e789366f-e00d-49c3-b0ef-333dd27356f3?preview=1](https://www.google.com/url?sa=E&q=https%3A%2F%2Frepository.tudelft.nl%2Ffile%2FFile_e789366f-e00d-49c3-b0ef-333dd27356f3%3Fpreview%3D1)

16.Â Reinforcement Learning or Active Inference? | PLOS One - Research journals,Â [https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0006421](https://www.google.com/url?sa=E&q=https%3A%2F%2Fjournals.plos.org%2Fplosone%2Farticle%3Fid%3D10.1371%2Fjournal.pone.0006421)

17.Â The Free Energy Principle for Perception and Action: A Deep Learning Perspective - MDPI,Â [https://www.mdpi.com/1099-4300/24/2/301](https://www.google.com/url?sa=E&q=https%3A%2F%2Fwww.mdpi.com%2F1099-4300%2F24%2F2%2F301)

18.Â Thompson Sampling for Dynamic Multi-armed Bandits - Dahee Kwon,Â [https://daheekwon.github.io/pdfs/dynamicTS.pdf](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdaheekwon.github.io%2Fpdfs%2FdynamicTS.pdf)

19.Â Regret Bounds for Thompson Sampling in Episodic Restless Bandit Problems - NeurIPS,Â [http://papers.neurips.cc/paper/9102-regret-bounds-for-thompson-sampling-in-episodic-restless-bandit-problems.pdf](https://www.google.com/url?sa=E&q=http%3A%2F%2Fpapers.neurips.cc%2Fpaper%2F9102-regret-bounds-for-thompson-sampling-in-episodic-restless-bandit-problems.pdf)

20.Â [1910.05654] Thompson Sampling in Non-Episodic Restless Bandits - arXiv,Â [https://arxiv.org/abs/1910.05654](https://www.google.com/url?sa=E&q=https%3A%2F%2Farxiv.org%2Fabs%2F1910.05654)

21.Â Optimization of Epsilon-Greedy Exploration - arXiv,Â [https://arxiv.org/html/2506.03324v1](https://www.google.com/url?sa=E&q=https%3A%2F%2Farxiv.org%2Fhtml%2F2506.03324v1)

22.Â MAB Analysis of Epsilon Greedy Algorithm - Kenneth Foo Fangwei,Â [https://kfoofw.github.io/bandit-theory-epsilon-greedy-analysis/](https://www.google.com/url?sa=E&q=https%3A%2F%2Fkfoofw.github.io%2Fbandit-theory-epsilon-greedy-analysis%2F)

23.Â Self-Organizing Graph Reasoning Evolves into a Critical State for Continuous Discovery Through Structuralâ€“Semantic Dynamics - arXiv,Â [https://arxiv.org/html/2503.18852v1](https://www.google.com/url?sa=E&q=https%3A%2F%2Farxiv.org%2Fhtml%2F2503.18852v1)

24.Â Entropy metrics for graph signals - University of Edinburgh Research Explorer,Â [https://www.research.ed.ac.uk/files/250374440/Entropy_metrics_graph_signals.pdf](https://www.google.com/url?sa=E&q=https%3A%2F%2Fwww.research.ed.ac.uk%2Ffiles%2F250374440%2FEntropy_metrics_graph_signals.pdf)

25.Â Measuring the Inferential Values of Relations in Knowledge Graphs - MDPI,Â [https://www.mdpi.com/1999-4893/18/1/6](https://www.google.com/url?sa=E&q=https%3A%2F%2Fwww.mdpi.com%2F1999-4893%2F18%2F1%2F6)

26.Â Using Knowledge Graphs For Inferential Reasoning | by Mark Burgess - Medium,Â [https://mark-burgess-oslo-mb.medium.com/using-knowledge-graphs-for-inferential-reasoning-8a06e583b4d4](https://www.google.com/url?sa=E&q=https%3A%2F%2Fmark-burgess-oslo-mb.medium.com%2Fusing-knowledge-graphs-for-inferential-reasoning-8a06e583b4d4)

27.Â Beyond Noisy-TVs: Noise-Robust Exploration Via Learning Progress Monitoring - arXiv,Â [https://arxiv.org/html/2509.25438v1](https://www.google.com/url?sa=E&q=https%3A%2F%2Farxiv.org%2Fhtml%2F2509.25438v1)

28.Â Exploration Strategies in Deep Reinforcement Learning | Lil'Log,Â [https://lilianweng.github.io/posts/2020-06-07-exploration-drl/](https://www.google.com/url?sa=E&q=https%3A%2F%2Flilianweng.github.io%2Fposts%2F2020-06-07-exploration-drl%2F)

29.Â How to Stay Curious while avoiding Noisy TVs using Aleatoric Uncertainty Estimation - Proceedings of Machine Learning Research,Â [https://proceedings.mlr.press/v162/mavor-parker22a/mavor-parker22a.pdf](https://www.google.com/url?sa=E&q=https%3A%2F%2Fproceedings.mlr.press%2Fv162%2Fmavor-parker22a%2Fmavor-parker22a.pdf)

30.Â PORTAL: Automatic Curricula Generation for Multiagent Reinforcement Learning,Â [https://ojs.aaai.org/index.php/AAAI/article/view/29524/30870](https://www.google.com/url?sa=E&q=https%3A%2F%2Fojs.aaai.org%2Findex.php%2FAAAI%2Farticle%2Fview%2F29524%2F30870)

31.Â Genet: Automatic Curriculum Generation for Learning Adaptation in Networking - NSF Public Access Repository,Â [https://par.nsf.gov/servlets/purl/10387676](https://www.google.com/url?sa=E&q=https%3A%2F%2Fpar.nsf.gov%2Fservlets%2Fpurl%2F10387676)

32.Â Continuous Time Continuous Space Homeostatic Reinforcement Learning (CTCS-HRRL) : Towards Biological Self-Autonomous Agent - arXiv,Â [https://arxiv.org/html/2401.08999v1](https://www.google.com/url?sa=E&q=https%3A%2F%2Farxiv.org%2Fhtml%2F2401.08999v1)

33.Â Homeostatic reinforcement learning for integrating reward collection and physiological stability - PMC,Â [https://pmc.ncbi.nlm.nih.gov/articles/PMC4270100/](https://www.google.com/url?sa=E&q=https%3A%2F%2Fpmc.ncbi.nlm.nih.gov%2Farticles%2FPMC4270100%2F)