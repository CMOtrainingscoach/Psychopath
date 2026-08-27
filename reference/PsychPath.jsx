import React, { useState, useEffect, useMemo, useRef } from "react";

/* ============================================================
   PsychPath — a Duolingo-style psychology trainer for Patty
   Paths → Lessons → Chapters → (small quiz) → Lesson Checkpoint
   Cartoon psychologist guides, XP, levels, streaks, saved progress
   ============================================================ */

/* -------------------- Cartoon psychologist avatars -------------------- */
const SKIN = "#f2c6a0";
function Avatar({ cfg, size = 96 }) {
  const {
    bg = "#efe9ff",
    skin = SKIN,
    hair = "short",
    hairColor = "#6b7280",
    beard = false,
    mustache = false,
    glasses = false,
    accessory = "none",
  } = cfg || {};
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="49" fill={bg} />
      {/* neck + shoulders */}
      <rect x="43" y="66" width="14" height="12" rx="6" fill={skin} />
      <path d="M24 100 Q50 74 76 100 Z" fill="#ffffff" opacity="0.85" />
      {/* ears */}
      <circle cx="27" cy="52" r="5" fill={skin} />
      <circle cx="73" cy="52" r="5" fill={skin} />
      {/* head */}
      <ellipse cx="50" cy="50" rx="24" ry="26" fill={skin} />
      {/* beard behind mouth */}
      {beard && (
        <path
          d="M28 52 Q30 82 50 84 Q70 82 72 52 Q66 68 50 68 Q34 68 28 52 Z"
          fill={hairColor}
        />
      )}
      {/* eyes */}
      <circle cx="41" cy="49" r="3.1" fill="#2f2a3d" />
      <circle cx="59" cy="49" r="3.1" fill="#2f2a3d" />
      <circle cx="42" cy="48" r="1" fill="#fff" />
      <circle cx="60" cy="48" r="1" fill="#fff" />
      {/* brows */}
      <path d="M36 43 Q41 41 46 43" stroke={hairColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M54 43 Q59 41 64 43" stroke={hairColor} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* nose */}
      <path d="M50 51 Q52 56 49 57" stroke="#c98d68" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* mouth */}
      {!mustache ? (
        <path d="M43 61 Q50 66 57 61" stroke="#a65b47" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M44 62 Q50 65 56 62" stroke="#a65b47" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      )}
      {mustache && (
        <path d="M42 58 Q50 55 58 58 Q50 61 42 58 Z" fill={hairColor} />
      )}
      {/* hair */}
      {hair === "short" && (
        <path d="M26 46 Q26 22 50 22 Q74 22 74 46 Q70 34 50 33 Q30 34 26 46 Z" fill={hairColor} />
      )}
      {hair === "sides" && (
        <>
          <path d="M26 54 Q24 36 33 30 Q30 40 30 52 Z" fill={hairColor} />
          <path d="M74 54 Q76 36 67 30 Q70 40 70 52 Z" fill={hairColor} />
          <path d="M30 30 Q50 24 70 30 Q50 27 30 30 Z" fill={hairColor} opacity="0.5" />
        </>
      )}
      {hair === "bald" && (
        <>
          <path d="M28 56 Q26 44 31 40 Q30 48 31 56 Z" fill={hairColor} />
          <path d="M72 56 Q74 44 69 40 Q70 48 69 56 Z" fill={hairColor} />
          <ellipse cx="45" cy="30" rx="8" ry="4" fill="#fff" opacity="0.18" />
        </>
      )}
      {hair === "long" && (
        <>
          <path d="M24 66 Q22 30 50 24 Q78 30 76 66 Q72 40 50 36 Q28 40 24 66 Z" fill={hairColor} />
        </>
      )}
      {hair === "curly" && (
        <>
          <path d="M28 40 a7 7 0 1 1 12 -4 a7 7 0 1 1 20 0 a7 7 0 1 1 12 4 Q70 30 50 28 Q30 30 28 40 Z" fill={hairColor} />
        </>
      )}
      {/* glasses */}
      {glasses && (
        <g stroke="#37324a" strokeWidth="1.8" fill="none">
          <circle cx="41" cy="49" r="7" fill="#ffffff" fillOpacity="0.25" />
          <circle cx="59" cy="49" r="7" fill="#ffffff" fillOpacity="0.25" />
          <path d="M48 49 H52" />
          <path d="M34 48 L30 47" />
          <path d="M66 48 L70 47" />
        </g>
      )}
      {/* accessories */}
      {accessory === "cigar" && (
        <g>
          <rect x="57" y="61" width="16" height="3.4" rx="1.7" fill="#8a5a2b" transform="rotate(8 57 61)" />
          <circle cx="74" cy="64" r="2.1" fill="#ff7a3d" />
        </g>
      )}
      {accessory === "bowtie" && (
        <path d="M44 74 L50 77 L44 80 Z M56 74 L50 77 L56 80 Z" fill="#e0466b" />
      )}
    </svg>
  );
}

/* -------------------- Teacher roster -------------------- */
const T = {
  wundt: { name: "Wilhelm Wundt", tag: "Father of experimental psychology",
    cfg: { bg: "#e9e3ff", hair: "sides", hairColor: "#5b5563", beard: true, mustache: true, glasses: true } },
  pavlov: { name: "Ivan Pavlov", tag: "Classical conditioning",
    cfg: { bg: "#d6f5f0", hair: "bald", hairColor: "#e7e7ea", beard: true, mustache: true } },
  skinner: { name: "B. F. Skinner", tag: "Operant conditioning",
    cfg: { bg: "#d6f5f0", hair: "short", hairColor: "#8a8f98", glasses: true } },
  bandura: { name: "Albert Bandura", tag: "Observational learning",
    cfg: { bg: "#d6f5f0", hair: "short", hairColor: "#9aa0a8", glasses: true } },
  loftus: { name: "Elizabeth Loftus", tag: "Memory & eyewitness",
    cfg: { bg: "#ffedd0", hair: "long", hairColor: "#7a5233", glasses: true } },
  piaget: { name: "Jean Piaget", tag: "Cognitive development",
    cfg: { bg: "#ffe0ef", hair: "bald", hairColor: "#e7e7ea", glasses: true, accessory: "bowtie" } },
  ainsworth: { name: "Mary Ainsworth", tag: "Attachment theory",
    cfg: { bg: "#ffe0ef", hair: "curly", hairColor: "#b9bdc4", glasses: true } },
  milgram: { name: "Stanley Milgram", tag: "Obedience to authority",
    cfg: { bg: "#dcecff", hair: "short", hairColor: "#3f3a49" } },
  festinger: { name: "Leon Festinger", tag: "Cognitive dissonance",
    cfg: { bg: "#dcecff", hair: "short", hairColor: "#4b4650", glasses: true } },
  freud: { name: "Sigmund Freud", tag: "The unconscious mind",
    cfg: { bg: "#efe6ff", hair: "short", hairColor: "#8a8f98", beard: true, mustache: true, glasses: true, accessory: "cigar" } },
  maslow: { name: "Abraham Maslow", tag: "Humanistic psychology",
    cfg: { bg: "#efe6ff", hair: "short", hairColor: "#3f3a49", mustache: true, glasses: true } },
};

/* -------------------- Curriculum -------------------- */
/* card types: 'idea' (core), 'eg' (example), 'tip', 'name' (person/term) */
const PATHS = [
  {
    id: "foundations", title: "Foundations", subtitle: "What psychology is & how it works",
    color: "#6C5CE7", teacher: "wundt", icon: "🧠",
    lessons: [
      {
        id: "f1", title: "What Is Psychology?", teacher: "wundt",
        chapters: [
          { id: "f1c1", title: "The science of mind & behavior",
            cards: [
              { t: "idea", h: "A definition", b: "Psychology is the scientific study of mind and behavior. 'Behavior' is anything an organism does; 'mental processes' are the internal experiences we infer from it." },
              { t: "idea", h: "Why 'scientific' matters", b: "Psychology relies on systematic observation and evidence rather than intuition or common sense. Claims are tested, not just asserted." },
              { t: "tip", h: "Four goals", b: "Psychologists aim to describe, explain, predict, and (sometimes) change behavior." },
            ],
            quiz: [
              { q: "Psychology is best defined as the study of…", o: ["Only the unconscious mind", "Mind and behavior, studied scientifically", "How to give advice", "The brain's anatomy alone"], a: 1, e: "It covers both behavior and mental processes, using scientific methods." },
              { q: "Which is NOT one of psychology's four goals?", o: ["Describe", "Predict", "Explain", "Sell"], a: 3, e: "The four goals are describe, explain, predict, and change." },
              { q: "Relying on 'common sense' instead of evidence is a problem because…", o: ["It is always wrong", "Intuitions can be biased and untested", "It is illegal", "It takes too long"], a: 1, e: "Intuition feels convincing but is often biased; science tests claims." },
            ] },
          { id: "f1c2", title: "Where psychology came from",
            cards: [
              { t: "name", h: "Wilhelm Wundt (1879)", b: "Opened the first psychology laboratory in Leipzig, Germany — the moment psychology split from philosophy into its own science." },
              { t: "idea", h: "Structuralism", b: "Edward Titchener used introspection to break conscious experience into basic 'elements' of sensation and feeling." },
              { t: "idea", h: "Functionalism", b: "William James asked what mind is *for* — how consciousness helps us adapt and survive, inspired by Darwin." },
            ],
            quiz: [
              { q: "Who founded the first psychology lab in 1879?", o: ["Freud", "James", "Wundt", "Skinner"], a: 2, e: "Wundt's Leipzig lab marks the birth of psychology as a science." },
              { q: "Introspection was the main method of…", o: ["Functionalism", "Structuralism", "Behaviorism", "Biology"], a: 1, e: "Structuralists used introspection to find the elements of experience." },
              { q: "Functionalism focused on…", o: ["The purpose of mental processes", "Brain chemistry", "Dream symbols", "Reflexes only"], a: 0, e: "James asked what mind is for — how it helps us adapt." },
            ] },
          { id: "f1c3", title: "The seven big perspectives",
            cards: [
              { t: "idea", h: "One mind, many lenses", b: "Modern psychology explains behavior through complementary perspectives — each a different level of analysis." },
              { t: "name", h: "The seven lenses", b: "Biological, psychodynamic, behavioral, cognitive, humanistic, evolutionary, and sociocultural." },
              { t: "eg", h: "Example: anxiety", b: "Biological blames brain chemistry; behavioral sees learned associations; cognitive points to catastrophic thoughts; sociocultural to context. All can be partly true." },
            ],
            quiz: [
              { q: "Explaining behavior with brain chemistry uses the ___ perspective.", o: ["Behavioral", "Biological", "Humanistic", "Cognitive"], a: 1, e: "The biological perspective focuses on brain, genes, and neurochemistry." },
              { q: "'People are driven to grow and self-actualize' fits the ___ perspective.", o: ["Humanistic", "Psychodynamic", "Evolutionary", "Behavioral"], a: 0, e: "Humanistic psychology emphasizes growth, choice, and potential." },
              { q: "Focusing on how thoughts and memory shape behavior is the ___ view.", o: ["Sociocultural", "Cognitive", "Biological", "Psychodynamic"], a: 1, e: "The cognitive perspective studies mental processing." },
            ] },
        ],
        test: [
          { q: "Psychology became a distinct science when…", o: ["Freud published his dream book", "Wundt opened his lab in 1879", "Skinner built his box", "James wrote a textbook"], a: 1, e: "Wundt's 1879 lab is the standard marker." },
          { q: "Which pairs a thinker with the RIGHT school?", o: ["James – structuralism", "Titchener – functionalism", "Wundt – experimental psychology", "Skinner – humanism"], a: 2, e: "Wundt pioneered experimental psychology." },
          { q: "The four goals of psychology are describe, explain, predict, and…", o: ["Judge", "Change", "Diagnose", "Sell"], a: 1, e: "Describe, explain, predict, change." },
          { q: "Which perspective would emphasize unconscious conflict?", o: ["Behavioral", "Psychodynamic", "Cognitive", "Biological"], a: 1, e: "The psychodynamic view stresses unconscious drives and conflict." },
          { q: "The best reason psychology insists on evidence is that…", o: ["Scientists distrust people", "Intuition is often biased and untested", "It sounds impressive", "Laws require it"], a: 1, e: "Systematic evidence corrects our biased intuitions." },
        ],
      },
      {
        id: "f2", title: "Thinking Like a Scientist", teacher: "wundt",
        chapters: [
          { id: "f2c1", title: "The scientific method",
            cards: [
              { t: "idea", h: "The loop", b: "Ask a question → form a testable hypothesis → operationally define your variables → collect data → analyze → revise theory. Then repeat." },
              { t: "name", h: "Operational definition", b: "Spelling out exactly how you'll measure a concept. 'Stress' becomes, say, 'heart rate above 100 bpm during a timed task.'" },
              { t: "tip", h: "Falsifiability", b: "A good hypothesis must be able to be proven wrong. If no evidence could ever contradict it, it isn't scientific." },
            ],
            quiz: [
              { q: "An operational definition…", o: ["States a theory's goal", "Specifies exactly how a variable is measured", "Is the study's conclusion", "Describes the sample"], a: 1, e: "It turns a fuzzy concept into something measurable." },
              { q: "A scientific hypothesis must be…", o: ["Popular", "Falsifiable", "Complicated", "Proven first"], a: 1, e: "It must be capable of being shown false." },
              { q: "The scientific method is best described as…", o: ["A one-time proof", "A self-correcting cycle", "Pure logic without data", "Expert opinion"], a: 1, e: "It loops: test, revise, retest." },
            ] },
          { id: "f2c2", title: "Research designs",
            cards: [
              { t: "idea", h: "Experiments", b: "Manipulate an independent variable (IV) and measure a dependent variable (DV), holding other things constant. Only experiments can show cause and effect." },
              { t: "name", h: "Control & random assignment", b: "A control group provides a baseline. Randomly assigning people to groups spreads out differences so the groups start equivalent." },
              { t: "idea", h: "Correlation ≠ causation", b: "Correlational studies measure how variables relate without manipulation. A relationship can't tell you which caused which — or if a third variable did." },
            ],
            quiz: [
              { q: "The variable the experimenter manipulates is the…", o: ["Dependent variable", "Independent variable", "Confound", "Control"], a: 1, e: "The IV is manipulated; the DV is measured." },
              { q: "Only ___ studies can establish cause and effect.", o: ["Correlational", "Experimental", "Case", "Survey"], a: 1, e: "Manipulation + control is what licenses causal claims." },
              { q: "Ice-cream sales and drownings both rise in summer. This shows…", o: ["Ice cream causes drowning", "A third variable (heat) at work", "Drowning causes cravings", "Nothing"], a: 1, e: "A classic third-variable/confound problem." },
            ] },
          { id: "f2c3", title: "Research ethics",
            cards: [
              { t: "idea", h: "Protecting participants", b: "Core rules: informed consent, the right to withdraw, protection from harm, confidentiality, and debriefing afterward." },
              { t: "name", h: "The IRB", b: "An ethics board reviews studies before they run to weigh risks against benefits. Deception is allowed only when justified and followed by debriefing." },
              { t: "tip", h: "Why it exists", b: "Historical studies that harmed participants led to today's strict codes — ethics is not optional paperwork." },
            ],
            quiz: [
              { q: "Telling participants what they experienced afterward is called…", o: ["Consent", "Debriefing", "Sampling", "Coding"], a: 1, e: "Debriefing happens after the study, especially if deception was used." },
              { q: "Which is a core ethical requirement?", o: ["Guaranteed positive results", "Informed consent", "Paying everyone equally", "Publishing fast"], a: 1, e: "Consent is foundational." },
              { q: "An IRB's job is to…", o: ["Fund studies", "Review studies for ethics before they run", "Analyze the data", "Recruit participants"], a: 1, e: "It weighs risks vs. benefits in advance." },
            ] },
        ],
        test: [
          { q: "You measure reaction time as your ___ variable.", o: ["Independent", "Dependent", "Confounding", "Control"], a: 1, e: "The measured outcome is the DV." },
          { q: "Random assignment matters because it…", o: ["Makes groups start out equivalent", "Guarantees big effects", "Removes the need for a control group", "Is required by law"], a: 0, e: "It balances unknown differences across groups." },
          { q: "A correlation of −0.8 means…", o: ["No relationship", "A strong inverse relationship", "Causation", "A weak positive link"], a: 1, e: "Sign = direction, magnitude = strength; −0.8 is strong and inverse." },
          { q: "Deception in a study is acceptable only if…", o: ["It saves money", "It is justified and followed by debriefing", "Participants never find out", "The results are important"], a: 1, e: "Justification plus debriefing is required." },
          { q: "A testable claim that no evidence could ever contradict is…", o: ["Strong science", "Not falsifiable, so not scientific", "A control", "A hypothesis"], a: 1, e: "Falsifiability is essential." },
        ],
      },
    ],
  },

  {
    id: "learning", title: "Learning & Behavior", subtitle: "How experience changes us",
    color: "#12B3A6", teacher: "pavlov", icon: "🔔",
    lessons: [
      {
        id: "l1", title: "Classical Conditioning", teacher: "pavlov",
        chapters: [
          { id: "l1c1", title: "Pavlov's dogs",
            cards: [
              { t: "idea", h: "Learning by association", b: "A neutral stimulus becomes able to trigger a reflex after being paired with something that already triggers it." },
              { t: "name", h: "The four terms", b: "Food (UCS) → salivation (UCR). Pair a bell (neutral) with food; the bell becomes a CS that triggers salivation (CR)." },
              { t: "tip", h: "Reflex, not choice", b: "Classical conditioning works on automatic, involuntary responses — salivation, fear, nausea — not deliberate actions." },
            ],
            quiz: [
              { q: "Before conditioning, the bell is a…", o: ["UCS", "Neutral stimulus", "CR", "CS"], a: 1, e: "It's neutral until paired with the UCS." },
              { q: "Salivation to food (before any learning) is the…", o: ["CR", "UCR", "CS", "UCS"], a: 1, e: "It's the unconditioned, automatic response." },
              { q: "After conditioning, the bell is the ___ and salivation to it is the ___.", o: ["UCS / UCR", "CS / CR", "CR / CS", "NS / UCR"], a: 1, e: "The bell becomes the conditioned stimulus; the response is conditioned." },
            ] },
          { id: "l1c2", title: "Acquisition, extinction & more",
            cards: [
              { t: "idea", h: "Acquisition & extinction", b: "Acquisition is learning the CS–UCS link. Extinction is the fading of the CR when the CS keeps appearing without the UCS." },
              { t: "name", h: "Spontaneous recovery", b: "After extinction and a rest, the CR can briefly reappear — showing the association was suppressed, not erased." },
              { t: "idea", h: "Generalization vs discrimination", b: "Generalization: similar stimuli trigger the CR. Discrimination: learning to respond only to the specific CS." },
            ],
            quiz: [
              { q: "The CR fades when the bell rings with no food. This is…", o: ["Acquisition", "Extinction", "Recovery", "Generalization"], a: 1, e: "Repeated CS-without-UCS produces extinction." },
              { q: "A dog fearing all men after one scary man shows…", o: ["Discrimination", "Generalization", "Extinction", "Recovery"], a: 1, e: "Similar stimuli evoke the response = generalization." },
              { q: "Spontaneous recovery suggests the association was…", o: ["Never formed", "Suppressed, not erased", "Only genetic", "Reversed"], a: 1, e: "It re-emerges, so it was suppressed." },
            ] },
        ],
        test: [
          { q: "Match: UCS is to UCR as CS is to…", o: ["UCS", "CR", "NS", "IV"], a: 1, e: "The conditioned stimulus triggers the conditioned response." },
          { q: "'Little Albert' learning to fear a white rat is an example of…", o: ["Operant conditioning", "Classical conditioning", "Modeling", "Extinction"], a: 1, e: "A fear reflex was conditioned to a neutral stimulus." },
          { q: "Responding to a buzzer but NOT a similar tone is…", o: ["Generalization", "Discrimination", "Acquisition", "Recovery"], a: 1, e: "Discrimination = responding only to the specific CS." },
          { q: "Classical conditioning best explains learning of…", o: ["Voluntary skills", "Automatic reflexive responses", "Language grammar", "Math"], a: 1, e: "It targets involuntary responses." },
          { q: "To extinguish a conditioned fear you would…", o: ["Pair the CS with the UCS more", "Present the CS repeatedly without the UCS", "Change the UCR", "Add a reward"], a: 1, e: "CS without UCS weakens the CR." },
        ],
      },
      {
        id: "l2", title: "Operant Conditioning", teacher: "skinner",
        chapters: [
          { id: "l2c1", title: "Reinforcement & punishment",
            cards: [
              { t: "idea", h: "Consequences shape behavior", b: "Skinner showed behavior is strengthened or weakened by what follows it. Reinforcement increases behavior; punishment decreases it." },
              { t: "name", h: "Positive vs negative", b: "'Positive' = add something; 'negative' = remove something. It's a math sign, not 'good/bad.'" },
              { t: "eg", h: "The 2×2", b: "Positive reinforcement: give a treat. Negative reinforcement: stop nagging. Positive punishment: add a fine. Negative punishment: take the phone away." },
            ],
            quiz: [
              { q: "Taking away a teen's phone to reduce rudeness is…", o: ["Positive reinforcement", "Negative punishment", "Negative reinforcement", "Positive punishment"], a: 1, e: "Removing something to decrease behavior = negative punishment." },
              { q: "'Negative reinforcement' means…", o: ["Punishing", "Removing something unpleasant to increase behavior", "Ignoring", "Adding a reward"], a: 1, e: "Remove an aversive → behavior increases." },
              { q: "Reinforcement always ___ behavior.", o: ["Decreases", "Increases", "Deletes", "Randomizes"], a: 1, e: "By definition reinforcement strengthens behavior." },
            ] },
          { id: "l2c2", title: "Schedules of reinforcement",
            cards: [
              { t: "idea", h: "Ratio vs interval", b: "Ratio schedules reward after a number of responses; interval schedules reward after time passes. Each can be fixed or variable." },
              { t: "name", h: "The four schedules", b: "Fixed-ratio, variable-ratio, fixed-interval, variable-interval — each produces a distinct pattern of responding." },
              { t: "tip", h: "Why slot machines hook us", b: "Variable-ratio schedules (reward after an unpredictable number of responses) produce the highest, most extinction-resistant response rates." },
            ],
            quiz: [
              { q: "A slot machine uses a ___ schedule.", o: ["Fixed-interval", "Variable-ratio", "Fixed-ratio", "Variable-interval"], a: 1, e: "Unpredictable payout per pull = variable-ratio." },
              { q: "Which schedule is MOST resistant to extinction?", o: ["Fixed-ratio", "Fixed-interval", "Variable-ratio", "Variable-interval"], a: 2, e: "Variable-ratio produces the most persistent behavior." },
              { q: "A paycheck every two weeks is a ___ schedule.", o: ["Fixed-interval", "Variable-ratio", "Fixed-ratio", "Variable-interval"], a: 0, e: "Reward after a set time = fixed-interval." },
            ] },
        ],
        test: [
          { q: "Skinner's 'operant' behavior is…", o: ["Reflexive", "Voluntary and shaped by consequences", "Genetic", "Unconscious"], a: 1, e: "Operant conditioning targets voluntary actions." },
          { q: "Adding a chore to reduce lying is…", o: ["Negative reinforcement", "Positive punishment", "Positive reinforcement", "Extinction"], a: 1, e: "Adding an aversive to reduce behavior." },
          { q: "Buckling up to stop the annoying beep is reinforced by…", o: ["Positive reinforcement", "Negative reinforcement", "Positive punishment", "Nothing"], a: 1, e: "Removing the aversive beep strengthens buckling." },
          { q: "Gambling's grip is best explained by…", o: ["Fixed-interval", "Variable-ratio reinforcement", "Punishment", "Classical conditioning"], a: 1, e: "Variable-ratio drives persistent responding." },
          { q: "Compared with classical conditioning, operant conditioning is about…", o: ["Reflexes", "Consequences of voluntary behavior", "Digestion", "Dreams"], a: 1, e: "Consequences shape voluntary behavior." },
        ],
      },
      {
        id: "l3", title: "Observational Learning", teacher: "bandura",
        chapters: [
          { id: "l3c1", title: "The Bobo doll & modeling",
            cards: [
              { t: "idea", h: "We learn by watching", b: "Bandura showed children imitate aggression they see modeled by adults — learning without any direct reinforcement of their own." },
              { t: "name", h: "Vicarious reinforcement", b: "Seeing a model rewarded (or punished) changes whether we imitate them. We learn from others' consequences." },
              { t: "tip", h: "Four steps", b: "Attention → retention → reproduction → motivation. You must notice, remember, be able to do it, and want to." },
            ],
            quiz: [
              { q: "The Bobo doll study demonstrated…", o: ["Classical conditioning", "Learning by observation", "Extinction", "Reflexes"], a: 1, e: "Children imitated modeled aggression." },
              { q: "Copying a model because you saw them rewarded is…", o: ["Direct reinforcement", "Vicarious reinforcement", "Punishment", "Extinction"], a: 1, e: "Learning from others' consequences." },
              { q: "Which is NOT one of Bandura's four steps?", o: ["Attention", "Retention", "Digestion", "Motivation"], a: 2, e: "The four are attention, retention, reproduction, motivation." },
            ] },
        ],
        test: [
          { q: "Observational learning shows that reinforcement…", o: ["Must be direct to work", "Can be vicarious", "Is unnecessary always", "Only works on reflexes"], a: 1, e: "We can learn from others' outcomes." },
          { q: "A child copies a sibling praised for sharing. This is…", o: ["Classical conditioning", "Modeling with vicarious reinforcement", "Punishment", "Generalization"], a: 1, e: "Imitation driven by an observed reward." },
          { q: "Bandura's approach is often called…", o: ["Pure behaviorism", "Social-cognitive theory", "Psychoanalysis", "Structuralism"], a: 1, e: "It blends learning with cognition and social context." },
          { q: "You can 'know' a skill from watching but not perform it if you lack…", o: ["Attention", "Reproduction ability", "Memory", "A model"], a: 1, e: "Reproduction requires the physical/skill capacity." },
          { q: "Observational learning differs from operant conditioning because…", o: ["It needs no observation", "The learner need not act to learn", "It only uses punishment", "It is reflexive"], a: 1, e: "Learning can occur before any behavior is performed." },
        ],
      },
    ],
  },

  {
    id: "memory", title: "Memory & Cognition", subtitle: "How the mind stores & thinks",
    color: "#F0932B", teacher: "loftus", icon: "💭",
    lessons: [
      {
        id: "m1", title: "How Memory Works", teacher: "loftus",
        chapters: [
          { id: "m1c1", title: "The three memory stores",
            cards: [
              { t: "idea", h: "The multi-store model", b: "Information flows through sensory memory → short-term memory → long-term memory. Attention and rehearsal move it along." },
              { t: "name", h: "Capacity & duration", b: "Sensory memory: huge but under a second. Short-term: about 7±2 items for ~15–30 seconds. Long-term: effectively unlimited and lasting." },
              { t: "tip", h: "Chunking", b: "Grouping items (like a phone number into blocks) beats short-term memory's small capacity by packing more into each 'slot.'" },
            ],
            quiz: [
              { q: "Short-term memory holds roughly…", o: ["2 items", "7±2 items", "50 items", "Unlimited"], a: 1, e: "Miller's 'magical number seven, plus or minus two.'" },
              { q: "Grouping digits to remember them is…", o: ["Encoding failure", "Chunking", "Extinction", "Priming"], a: 1, e: "Chunking increases effective capacity." },
              { q: "The correct flow is…", o: ["LTM → STM → sensory", "Sensory → STM → LTM", "STM → sensory → LTM", "Sensory → LTM → STM"], a: 1, e: "Sensory, then short-term, then long-term." },
            ] },
          { id: "m1c2", title: "Encoding & retrieval",
            cards: [
              { t: "idea", h: "Three stages", b: "Encoding gets information in, storage keeps it, retrieval gets it back out. A 'memory problem' can fail at any stage." },
              { t: "name", h: "Elaborative rehearsal", b: "Linking new material to what you already know (meaning) beats mere repetition for building durable long-term memories." },
              { t: "idea", h: "Retrieval cues", b: "Memory improves when the context or mood at recall matches the one at learning — context- and state-dependent memory." },
            ],
            quiz: [
              { q: "Connecting new facts to existing knowledge is…", o: ["Maintenance rehearsal", "Elaborative rehearsal", "Chunking", "Priming"], a: 1, e: "Elaboration creates richer, more durable memories." },
              { q: "Forgetting where a memory never formed properly is a failure of…", o: ["Encoding", "Retrieval", "Storage decay", "Interference"], a: 0, e: "If it never got in, encoding failed." },
              { q: "Recalling better in the room you studied in shows…", o: ["State-dependent memory", "Context-dependent memory", "Chunking", "Rehearsal"], a: 1, e: "External context acts as a retrieval cue." },
            ] },
        ],
        test: [
          { q: "The three memory processes are encoding, storage, and…", o: ["Chunking", "Retrieval", "Rehearsal", "Priming"], a: 1, e: "Encoding, storage, retrieval." },
          { q: "Sensory memory is best described as…", o: ["Small and permanent", "Huge but very brief", "Unlimited and lasting", "7±2 items"], a: 1, e: "Large capacity, sub-second duration." },
          { q: "For a lasting memory of a concept, best to use…", o: ["Rote repetition", "Elaborative rehearsal", "Cramming", "Ignoring cues"], a: 1, e: "Meaningful linking builds durable memory." },
          { q: "Studying while slightly caffeinated and recalling best while caffeinated is…", o: ["Context-dependent", "State-dependent", "Encoding failure", "Interference"], a: 1, e: "Internal state as a retrieval cue." },
          { q: "'Tip-of-the-tongue' is mainly a failure of…", o: ["Encoding", "Storage", "Retrieval", "Attention"], a: 2, e: "The memory exists but can't be accessed — retrieval." },
        ],
      },
      {
        id: "m2", title: "Fallible Memory", teacher: "loftus",
        chapters: [
          { id: "m2c1", title: "Reconstruction & false memories",
            cards: [
              { t: "idea", h: "Memory is reconstructive", b: "We don't replay recordings — we rebuild memories each time, filling gaps with expectations. That makes memory editable." },
              { t: "name", h: "The misinformation effect", b: "Loftus showed that misleading questions after an event can alter what people 'remember' seeing." },
              { t: "eg", h: "The car crash study", b: "Asking how fast cars were going when they 'smashed' (vs 'hit') led to higher speed estimates and more false memories of broken glass." },
            ],
            quiz: [
              { q: "Loftus's work shows memory is…", o: ["A perfect recording", "Reconstructed and editable", "Only genetic", "Always accurate under stress"], a: 1, e: "We rebuild memories, so they can be altered." },
              { q: "Misleading post-event questions cause the…", o: ["Priming effect", "Misinformation effect", "Chunking effect", "Recovery effect"], a: 1, e: "Later information reshapes the memory." },
              { q: "In the crash study, the verb 'smashed' led people to…", o: ["Recall lower speeds", "Recall higher speeds and false glass", "Forget the event", "Recall perfectly"], a: 1, e: "Wording biased their reconstructed memory." },
            ] },
        ],
        test: [
          { q: "The main lesson of Loftus's research is that…", o: ["Eyewitnesses are infallible", "Memory can be distorted by later information", "Memory is a video", "Only children misremember"], a: 1, e: "Memory is malleable and reconstructive." },
          { q: "A false memory is…", o: ["A lie", "A confidently held memory of something that didn't happen", "A forgotten fact", "A retrieval cue"], a: 1, e: "It feels real but is inaccurate." },
          { q: "Reconstructive memory means we fill gaps with…", o: ["Random noise", "Expectations and schemas", "Nothing", "New encoding"], a: 1, e: "Prior knowledge and expectations fill in gaps." },
          { q: "This research strongly affects the reliability of…", o: ["Math tests", "Eyewitness testimony", "Reflexes", "Reaction time"], a: 1, e: "Eyewitness accounts can be distorted." },
          { q: "High confidence in a memory means it is…", o: ["Definitely accurate", "Not necessarily accurate", "A false memory", "Recently encoded"], a: 1, e: "Confidence and accuracy are only loosely linked." },
        ],
      },
    ],
  },

  {
    id: "development", title: "Development", subtitle: "How we grow across a lifetime",
    color: "#E84393", teacher: "piaget", icon: "🌱",
    lessons: [
      {
        id: "d1", title: "Piaget's Stages", teacher: "piaget",
        chapters: [
          { id: "d1c1", title: "Schemas & adaptation",
            cards: [
              { t: "idea", h: "Building blocks of thought", b: "A schema is a mental framework for organizing information. Children build and revise schemas as they explore." },
              { t: "name", h: "Assimilation vs accommodation", b: "Assimilation fits new experiences into existing schemas; accommodation changes the schema to fit reality." },
              { t: "eg", h: "The 'doggy' example", b: "A toddler calls every four-legged animal 'doggy' (assimilation), then learns cats are different and updates the schema (accommodation)." },
            ],
            quiz: [
              { q: "A mental framework for organizing knowledge is a…", o: ["Stage", "Schema", "Reflex", "Cue"], a: 1, e: "Schemas organize thinking." },
              { q: "Changing a schema to fit new information is…", o: ["Assimilation", "Accommodation", "Conservation", "Egocentrism"], a: 1, e: "Accommodation updates the schema." },
              { q: "Calling a cat a 'dog' fits new info into an old schema — this is…", o: ["Assimilation", "Accommodation", "Discrimination", "Reversibility"], a: 0, e: "The experience is forced into the existing schema." },
            ] },
          { id: "d1c2", title: "The four stages",
            cards: [
              { t: "name", h: "Sensorimotor (0–2)", b: "Infants learn through senses and action; the key milestone is object permanence — knowing things exist when out of sight." },
              { t: "name", h: "Preoperational (2–7)", b: "Symbolic thought and language bloom, but children are egocentric and fail conservation (that quantity stays the same despite shape changes)." },
              { t: "name", h: "Concrete & formal", b: "Concrete operational (7–11): logical about concrete things, master conservation. Formal operational (12+): abstract and hypothetical reasoning." },
            ],
            quiz: [
              { q: "Object permanence develops in the ___ stage.", o: ["Preoperational", "Sensorimotor", "Concrete", "Formal"], a: 1, e: "It's the hallmark of the sensorimotor stage." },
              { q: "Failing conservation and being egocentric marks the ___ stage.", o: ["Sensorimotor", "Preoperational", "Concrete operational", "Formal operational"], a: 1, e: "Preoperational children can't yet conserve." },
              { q: "Abstract, hypothetical reasoning appears in the ___ stage.", o: ["Concrete operational", "Formal operational", "Preoperational", "Sensorimotor"], a: 1, e: "Formal operational thought handles abstraction." },
            ] },
        ],
        test: [
          { q: "Piaget believed children think…", o: ["Like small adults", "Qualitatively differently at each stage", "Only via reinforcement", "Only via imitation"], a: 1, e: "Each stage is a different kind of thinking." },
          { q: "A child knows a hidden toy still exists. They have…", o: ["Conservation", "Object permanence", "Reversibility", "Abstraction"], a: 1, e: "Object permanence." },
          { q: "Conservation is typically mastered in the ___ stage.", o: ["Sensorimotor", "Preoperational", "Concrete operational", "Formal operational"], a: 2, e: "Concrete operational children conserve." },
          { q: "Egocentrism in Piaget means…", o: ["Selfishness", "Difficulty taking another's viewpoint", "High self-esteem", "Aggression"], a: 1, e: "It's a cognitive limitation, not a personality flaw." },
          { q: "Updating a schema after surprising evidence is…", o: ["Assimilation", "Accommodation", "Conservation", "Habituation"], a: 1, e: "Accommodation." },
        ],
      },
      {
        id: "d2", title: "Attachment", teacher: "ainsworth",
        chapters: [
          { id: "d2c1", title: "Attachment styles",
            cards: [
              { t: "idea", h: "The bond that shapes us", b: "Attachment is the deep emotional bond between infant and caregiver. Bowlby argued it is a survival system with lifelong effects." },
              { t: "name", h: "The Strange Situation", b: "Ainsworth watched how babies reacted to separation and reunion with a caregiver to classify attachment styles." },
              { t: "name", h: "Three classic styles", b: "Secure (distressed at leaving, comforted at return), insecure-avoidant (indifferent), and insecure-resistant/ambivalent (distressed and hard to soothe)." },
            ],
            quiz: [
              { q: "Ainsworth's method for measuring attachment is the…", o: ["Bobo doll test", "Strange Situation", "Little Albert study", "Marshmallow test"], a: 1, e: "It observes separation and reunion." },
              { q: "A baby who is comforted quickly on reunion is likely…", o: ["Avoidant", "Secure", "Resistant", "Disorganized"], a: 1, e: "Secure infants use the caregiver as a safe base." },
              { q: "Attachment theory was pioneered by…", o: ["Skinner", "Bowlby", "Freud", "Wundt"], a: 1, e: "Bowlby framed attachment as an evolved system; Ainsworth measured it." },
            ] },
        ],
        test: [
          { q: "Attachment is best described as…", o: ["A learned habit only", "An emotional bond with survival value", "A reflex", "A personality trait"], a: 1, e: "Bowlby saw it as an evolved bonding system." },
          { q: "In the Strange Situation, the key moments are…", o: ["Feeding and sleep", "Separation and reunion", "Play alone", "Stranger only"], a: 1, e: "Reactions to leaving and returning classify style." },
          { q: "An infant indifferent to a caregiver leaving and returning is likely…", o: ["Secure", "Insecure-avoidant", "Insecure-resistant", "None"], a: 1, e: "Avoidant infants show little response." },
          { q: "A 'safe base' allows a securely attached child to…", o: ["Never explore", "Explore and return for comfort", "Fear strangers forever", "Ignore caregivers"], a: 1, e: "Security supports confident exploration." },
          { q: "Attachment research suggests early bonds…", o: ["Have no later effect", "Can shape later relationships", "Are purely genetic", "Only matter in infancy"], a: 1, e: "Early attachment can influence later relating." },
        ],
      },
    ],
  },

  {
    id: "social", title: "Social Psychology", subtitle: "How others shape us",
    color: "#0984E3", teacher: "milgram", icon: "👥",
    lessons: [
      {
        id: "s1", title: "Conformity & Obedience", teacher: "milgram",
        chapters: [
          { id: "s1c1", title: "Asch & conformity",
            cards: [
              { t: "idea", h: "The power of the group", b: "Conformity is adjusting behavior or opinion to match a group. Asch showed people will deny obvious facts to fit in." },
              { t: "name", h: "The line study", b: "Asked to match line lengths, many participants gave answers they could see were wrong — just because confederates did." },
              { t: "name", h: "Two reasons we conform", b: "Normative influence (to be liked/accepted) and informational influence (to be right when unsure)." },
            ],
            quiz: [
              { q: "Asch's line study measured…", o: ["Obedience", "Conformity", "Memory", "Attachment"], a: 1, e: "Matching a group's obviously wrong answer." },
              { q: "Conforming to be accepted by the group is ___ influence.", o: ["Informational", "Normative", "Coercive", "Vicarious"], a: 1, e: "Normative influence = wanting to fit in." },
              { q: "Conforming because you assume the group knows better is ___ influence.", o: ["Normative", "Informational", "Punitive", "Genetic"], a: 1, e: "Informational influence = seeking to be correct." },
            ] },
          { id: "s1c2", title: "Milgram & obedience",
            cards: [
              { t: "idea", h: "Obedience to authority", b: "Milgram tested how far ordinary people would go when an authority figure told them to harm another person." },
              { t: "name", h: "The shock study", b: "A majority of participants (about two-thirds) continued to the maximum 'shock' level when urged by the experimenter." },
              { t: "tip", h: "The lesson", b: "Situational pressure and legitimate-seeming authority — not evil personalities — drove obedience. Situations shape behavior powerfully." },
            ],
            quiz: [
              { q: "Milgram studied…", o: ["Conformity to peers", "Obedience to authority", "Memory", "Learning"], a: 1, e: "Following an authority's harmful orders." },
              { q: "Roughly what fraction went to the maximum shock?", o: ["About one-tenth", "About one-third", "About two-thirds", "Almost none"], a: 2, e: "About 65% obeyed to the end." },
              { q: "Milgram's main conclusion was that behavior is powerfully shaped by…", o: ["Genes", "The situation and authority", "Intelligence", "Age"], a: 1, e: "Situational forces, not just character." },
            ] },
        ],
        test: [
          { q: "Denying an obvious perceptual fact to match a group is…", o: ["Obedience", "Conformity", "Dissonance", "Attachment"], a: 1, e: "That's Asch-style conformity." },
          { q: "Normative influence is driven by the need to…", o: ["Be correct", "Be accepted", "Save time", "Obey"], a: 1, e: "Fitting in socially." },
          { q: "Milgram's participants mostly obeyed because of…", o: ["Cruelty", "Legitimate authority and situational pressure", "Low IQ", "Boredom"], a: 1, e: "Authority and situation, not personality." },
          { q: "Obedience differs from conformity in that obedience involves…", o: ["Peers of equal status", "A direct order from an authority", "No social influence", "Only children"], a: 1, e: "Obedience follows commands from authority." },
          { q: "A key ethical concern in Milgram's study was…", o: ["No consent form typos", "Severe stress to participants", "Too small a sample", "Wrong statistics"], a: 1, e: "Participants experienced significant distress." },
        ],
      },
      {
        id: "s2", title: "Attitudes & Dissonance", teacher: "festinger",
        chapters: [
          { id: "s2c1", title: "Cognitive dissonance",
            cards: [
              { t: "idea", h: "The discomfort of contradiction", b: "Festinger's cognitive dissonance is the tension we feel when our attitudes and actions clash. We're motivated to reduce it." },
              { t: "name", h: "The $1 vs $20 study", b: "People paid just $1 to say a boring task was fun later rated it as MORE fun — they changed their attitude to justify a poorly-paid lie." },
              { t: "tip", h: "How we resolve it", b: "We reduce dissonance by changing the attitude, changing the behavior, or adding a justification." },
            ],
            quiz: [
              { q: "Cognitive dissonance is the tension between…", o: ["Two people", "Attitudes and behavior that clash", "Memory and perception", "Reward and punishment"], a: 1, e: "Inconsistency between beliefs and actions." },
              { q: "In the classic study, who liked the boring task MORE?", o: ["Those paid $20", "Those paid $1", "Neither", "A control group"], a: 1, e: "Small payment gave weak justification, so they changed the attitude." },
              { q: "One way to reduce dissonance is to…", o: ["Increase the tension", "Change your attitude to match your action", "Forget the task", "Punish yourself"], a: 1, e: "Aligning attitude with behavior resolves it." },
            ] },
        ],
        test: [
          { q: "Cognitive dissonance theory was proposed by…", o: ["Milgram", "Festinger", "Asch", "Skinner"], a: 1, e: "Leon Festinger." },
          { q: "Paying someone MORE to lie tends to produce ___ attitude change.", o: ["More", "Less", "No", "Random"], a: 1, e: "Big payment justifies the lie, so less attitude change." },
          { q: "Dissonance is best described as a state of…", o: ["Physical pain", "Psychological discomfort", "Happiness", "Boredom"], a: 1, e: "An uncomfortable motivational tension." },
          { q: "'I smoke but smoking is bad' can be eased by…", o: ["Quitting or rationalizing", "Ignoring biology", "Adding a reward", "Conforming"], a: 0, e: "Change behavior or add justifications." },
          { q: "Dissonance research shows behavior can change…", o: ["Only after attitudes change", "Attitudes, not just the reverse", "Nothing", "Only in labs"], a: 1, e: "Action can drive attitude change." },
        ],
      },
    ],
  },

  {
    id: "personality", title: "Personality", subtitle: "What makes each of us us",
    color: "#9B59B6", teacher: "freud", icon: "🎭",
    lessons: [
      {
        id: "p1", title: "The Unconscious", teacher: "freud",
        chapters: [
          { id: "p1c1", title: "Id, ego & superego",
            cards: [
              { t: "idea", h: "A mind in three parts", b: "Freud proposed the id (unconscious drives, 'I want it now'), the superego (morals and ideals), and the ego (the realistic mediator)." },
              { t: "name", h: "The pleasure vs reality principle", b: "The id runs on the pleasure principle; the ego on the reality principle, delaying gratification to keep us functioning." },
              { t: "tip", h: "Mostly hidden", b: "Freud pictured the mind as an iceberg — most mental life is unconscious, influencing us without our awareness." },
            ],
            quiz: [
              { q: "The impulsive, pleasure-seeking part is the…", o: ["Ego", "Superego", "Id", "Persona"], a: 2, e: "The id demands immediate gratification." },
              { q: "The realistic mediator between drives and morals is the…", o: ["Id", "Ego", "Superego", "Unconscious"], a: 1, e: "The ego balances id and superego with reality." },
              { q: "The superego represents our…", o: ["Raw drives", "Moral standards", "Reflexes", "Memories"], a: 1, e: "The superego is conscience and ideals." },
            ] },
          { id: "p1c2", title: "Defense mechanisms",
            cards: [
              { t: "idea", h: "Protecting the ego", b: "Defense mechanisms are unconscious strategies that reduce anxiety by distorting reality." },
              { t: "name", h: "Common ones", b: "Repression (push away), denial (refuse to accept), projection (attribute your feelings to others), displacement (redirect onto a safer target)." },
              { t: "eg", h: "Sublimation", b: "Channeling unacceptable impulses into socially valued activity — like turning aggression into competitive sport — is the 'healthiest' defense." },
            ],
            quiz: [
              { q: "Accusing others of the hostility you feel is…", o: ["Denial", "Projection", "Repression", "Sublimation"], a: 1, e: "Projection attributes your feelings to others." },
              { q: "Taking out work anger on your family is…", o: ["Displacement", "Denial", "Projection", "Regression"], a: 0, e: "Displacement redirects onto a safer target." },
              { q: "Channeling impulses into valued work or art is…", o: ["Repression", "Sublimation", "Denial", "Projection"], a: 1, e: "Sublimation transforms impulses constructively." },
            ] },
        ],
        test: [
          { q: "Freud's iceberg metaphor stresses the power of the…", o: ["Conscious mind", "Unconscious mind", "Superego only", "Reflexes"], a: 1, e: "Most of the mind is hidden." },
          { q: "A toddler-like tantrum in an adult under stress is…", o: ["Projection", "Regression", "Sublimation", "Denial"], a: 1, e: "Regression = retreating to earlier behavior." },
          { q: "The ego operates on the ___ principle.", o: ["Pleasure", "Reality", "Moral", "Genetic"], a: 1, e: "Reality principle: realistic, delayed gratification." },
          { q: "Defense mechanisms mainly work to…", o: ["Improve memory", "Reduce anxiety by distorting reality", "Increase drives", "Teach morals"], a: 1, e: "They protect the ego from anxiety." },
          { q: "A major modern criticism of Freud's theory is that it is…", o: ["Too mathematical", "Hard to test/falsify", "Too behavioral", "Too simple"], a: 1, e: "Many concepts resist scientific testing." },
        ],
      },
      {
        id: "p2", title: "Humanism & Traits", teacher: "maslow",
        chapters: [
          { id: "p2c1", title: "Maslow's hierarchy",
            cards: [
              { t: "idea", h: "A ladder of needs", b: "Maslow arranged needs in a pyramid: we generally satisfy lower needs before pursuing higher ones." },
              { t: "name", h: "The five levels", b: "Physiological → safety → love/belonging → esteem → self-actualization (reaching your full potential)." },
              { t: "name", h: "Rogers' humanism", b: "Carl Rogers stressed unconditional positive regard and congruence between our real self and ideal self as keys to growth." },
            ],
            quiz: [
              { q: "The top of Maslow's pyramid is…", o: ["Safety", "Esteem", "Self-actualization", "Belonging"], a: 2, e: "Reaching full potential sits at the top." },
              { q: "Food, water, and sleep are ___ needs.", o: ["Esteem", "Physiological", "Safety", "Belonging"], a: 1, e: "The base of the pyramid." },
              { q: "Rogers' 'unconditional positive regard' means…", o: ["Rewarding good behavior only", "Acceptance without conditions", "Ignoring feelings", "Strict discipline"], a: 1, e: "Accepting a person fully, regardless of behavior." },
            ] },
          { id: "p2c2", title: "The Big Five traits",
            cards: [
              { t: "idea", h: "Traits, measured", b: "Modern trait theory describes personality along five broad dimensions, each a spectrum." },
              { t: "name", h: "OCEAN", b: "Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism — the most empirically supported model of personality." },
              { t: "tip", h: "Why it matters", b: "Unlike Freud's ideas, the Big Five is measurable, reliable, and predictive — a cornerstone of scientific personality psychology." },
            ],
            quiz: [
              { q: "The Big Five acronym OCEAN's 'N' stands for…", o: ["Novelty", "Neuroticism", "Nurturance", "Negativity"], a: 1, e: "Neuroticism = emotional instability vs stability." },
              { q: "Being organized and dependable reflects high…", o: ["Openness", "Conscientiousness", "Extraversion", "Agreeableness"], a: 1, e: "Conscientiousness covers self-discipline and order." },
              { q: "The Big Five is favored by scientists because it is…", o: ["Ancient", "Measurable and predictive", "Freudian", "Untestable"], a: 1, e: "It's empirically grounded and reliable." },
            ] },
        ],
        test: [
          { q: "Humanistic psychology emphasizes…", o: ["Unconscious conflict", "Growth, choice, and potential", "Reflexes", "Punishment"], a: 1, e: "It's an optimistic, growth-focused view." },
          { q: "Which need must generally be met before esteem needs?", o: ["Self-actualization", "Belonging", "Nothing", "Openness"], a: 1, e: "Belonging comes before esteem in the pyramid." },
          { q: "The five OCEAN traits include all EXCEPT…", o: ["Openness", "Conscientiousness", "Intelligence", "Agreeableness"], a: 2, e: "Intelligence is not one of the Big Five." },
          { q: "Rogers said growth needs the real self and ideal self to be…", o: ["Opposite", "Congruent", "Ignored", "Punished"], a: 1, e: "Congruence supports healthy development." },
          { q: "Compared with psychodynamic theory, the Big Five is more…", o: ["Speculative", "Scientifically testable", "Focused on dreams", "About childhood"], a: 1, e: "It is measurable and evidence-based." },
        ],
      },
    ],
  },
];

/* -------------------- Progress helpers -------------------- */
const STORE_KEY = "patty-psychpath-v1";
const XP_CHAPTER_BASE = 15;
const XP_PER_CORRECT = 5;
const XP_TEST_BONUS = 30;
const PASS_RATIO = 0.7;

const emptyProgress = () => ({
  xp: 0,
  streak: 0,
  lastActive: null,
  chapters: {}, // chapterId -> {best: n}
  tests: {}, // lessonId -> {score, total, passed}
});

function levelFromXP(xp) {
  // gentle curve; each level a bit longer than the last
  let lvl = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lvl += 1; need = Math.round(need * 1.15); }
  return { level: lvl, into: xp - acc, span: need, floor: acc };
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysBetween(a, b) {
  const d1 = new Date(a + "T00:00:00"), d2 = new Date(b + "T00:00:00");
  return Math.round((d2 - d1) / 86400000);
}

/* -------------------- App -------------------- */
export default function PsychPath() {
  const [progress, setProgress] = useState(emptyProgress());
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("home"); // home | chapter | quiz | result | profile
  const [pathId, setPathId] = useState("foundations");
  const [showPaths, setShowPaths] = useState(false);
  const [active, setActive] = useState(null); // {lesson, chapter?, mode}
  const [toast, setToast] = useState(null);

  // load fonts
  useEffect(() => {
    if (document.getElementById("pp-font")) return;
    const l = document.createElement("link");
    l.id = "pp-font"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap";
    document.head.appendChild(l);
  }, []);

  // load progress + update streak
  useEffect(() => {
    (async () => {
      let p = emptyProgress();
      try {
        const r = await window.storage.get(STORE_KEY);
        if (r && r.value) p = { ...p, ...JSON.parse(r.value) };
      } catch (e) { /* first run */ }
      const t = todayStr();
      if (p.lastActive) {
        const gap = daysBetween(p.lastActive, t);
        if (gap === 1) p.streak = (p.streak || 0) + 1;
        else if (gap > 1) p.streak = 1;
        else if (!p.streak) p.streak = 1;
      } else {
        p.streak = 1;
      }
      p.lastActive = t;
      setProgress(p);
      setLoaded(true);
    })();
  }, []);

  const save = async (p) => {
    setProgress(p);
    try { await window.storage.set(STORE_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ }
  };

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const path = PATHS.find((p) => p.id === pathId);

  // flatten lesson into ordered nodes (chapters + a final test)
  const nodesFor = (lesson) => {
    const arr = lesson.chapters.map((c) => ({ kind: "chapter", id: c.id, chapter: c, lesson }));
    arr.push({ kind: "test", id: lesson.id + "-test", lesson });
    return arr;
  };
  const pathNodes = useMemo(() => {
    const out = [];
    path.lessons.forEach((lesson) => { nodesFor(lesson).forEach((n) => out.push(n)); });
    return out;
  }, [pathId]);

  const isChapterDone = (id) => !!progress.chapters[id];
  const isTestPassed = (lessonId) => !!(progress.tests[lessonId] && progress.tests[lessonId].passed);

  const nodeStatus = (i) => {
    const n = pathNodes[i];
    const done = n.kind === "chapter" ? isChapterDone(n.id) : isTestPassed(n.lesson.id);
    if (done) return "done";
    if (i === 0) return "current";
    const prev = pathNodes[i - 1];
    const prevDone = prev.kind === "chapter" ? isChapterDone(prev.id) : isTestPassed(prev.lesson.id);
    return prevDone ? "current" : "locked";
  };

  const openChapter = (chapter, lesson) => { setActive({ lesson, chapter, mode: "learn" }); setView("chapter"); };
  const openTest = (lesson) => { setActive({ lesson, mode: "big" }); startQuiz(lesson, null, "big"); };

  /* ---- quiz state ---- */
  const [quiz, setQuiz] = useState(null);
  const startQuiz = (lesson, chapter, mode) => {
    const qs = mode === "big" ? lesson.test : chapter.quiz;
    setQuiz({ lesson, chapter, mode, qs, i: 0, correct: 0, picked: null, revealed: false, wrong: false });
    setView("quiz");
  };
  const chapterToQuiz = () => startQuiz(active.lesson, active.chapter, "small");

  const pick = (idx) => {
    if (quiz.revealed) return;
    const correct = idx === quiz.qs[quiz.i].a;
    setQuiz({ ...quiz, picked: idx, revealed: true, wrong: !correct, correct: quiz.correct + (correct ? 1 : 0) });
  };
  const nextQ = () => {
    if (quiz.i + 1 < quiz.qs.length) {
      setQuiz({ ...quiz, i: quiz.i + 1, picked: null, revealed: false, wrong: false });
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const total = quiz.qs.length;
    const correct = quiz.correct;
    const p = { ...progress, chapters: { ...progress.chapters }, tests: { ...progress.tests } };
    let earned = 0;
    let passed = true;
    if (quiz.mode === "big") {
      passed = correct / total >= PASS_RATIO;
      const prev = p.tests[quiz.lesson.id];
      const bestBefore = prev ? prev.score : -1;
      if (correct > bestBefore) p.tests[quiz.lesson.id] = { score: correct, total, passed: passed || (prev && prev.passed) };
      else if (prev) p.tests[quiz.lesson.id] = { ...prev, passed: prev.passed || passed };
      if (passed && (!prev || !prev.passed)) earned = correct * XP_PER_CORRECT + XP_TEST_BONUS;
      else if (passed) earned = 5; // small reward for re-passing
    } else {
      const first = !p.chapters[quiz.chapter.id];
      if (first) earned = XP_CHAPTER_BASE + correct * XP_PER_CORRECT;
      const bestBefore = p.chapters[quiz.chapter.id] ? p.chapters[quiz.chapter.id].best : 0;
      p.chapters[quiz.chapter.id] = { best: Math.max(bestBefore, correct) };
    }
    p.xp = (p.xp || 0) + earned;
    save(p);
    setQuiz({ ...quiz, done: true, earned, passed, total, correctFinal: correct });
    setView("result");
  };

  const backHome = () => { setView("home"); setActive(null); setQuiz(null); };

  if (!loaded) {
    return (
      <div style={S.appWrap}>
        <StyleTag />
        <div style={{ ...S.center, minHeight: 480 }}>
          <div className="pp-pulse" style={{ fontSize: 46 }}>🧠</div>
          <div style={{ color: "#8b86a5", fontWeight: 800, marginTop: 10 }}>Loading your journey…</div>
        </div>
      </div>
    );
  }

  const lv = levelFromXP(progress.xp);

  return (
    <div style={S.appWrap}>
      <StyleTag />

      {/* Top HUD */}
      <div style={S.hud}>
        <button
          className="pp-chip"
          onClick={() => setShowPaths((v) => !v)}
          style={{ ...S.pathChip, background: path.color }}
          aria-label="Switch learning path"
        >
          <span style={{ fontSize: 18 }}>{path.icon}</span>
          <span style={{ fontWeight: 900 }}>{path.title}</span>
          <span style={{ opacity: 0.85, fontWeight: 800, fontSize: 12 }}>▾</span>
        </button>
        <div style={S.stats}>
          <Stat icon="🔥" value={progress.streak} label="streak" color="#ff7a3d" />
          <Stat icon="⭐" value={progress.xp} label="XP" color="#f6b93b" />
          <button className="pp-chip" onClick={() => setView("profile")} style={S.lvlBtn} aria-label="View profile">
            <span style={{ fontWeight: 900 }}>Lv {lv.level}</span>
          </button>
        </div>
      </div>

      {/* Path picker sheet */}
      {showPaths && (
        <div style={S.sheetWrap} onClick={() => setShowPaths(false)}>
          <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Choose a path</div>
            <div style={{ color: "#8b86a5", fontSize: 13, marginBottom: 12 }}>
              Every path is open — follow whichever calls to you.
            </div>
            <div style={S.pathGrid}>
              {PATHS.map((p) => {
                const pct = pathPct(p, progress);
                return (
                  <button
                    key={p.id}
                    className="pp-press"
                    onClick={() => { setPathId(p.id); setShowPaths(false); setView("home"); }}
                    style={{ ...S.pathCard, borderColor: p.id === pathId ? p.color : "#eceaf5",
                      boxShadow: p.id === pathId ? `0 0 0 3px ${p.color}22` : "none" }}
                  >
                    <div style={{ ...S.pathIcon, background: p.color + "1f", color: p.color }}>{p.icon}</div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontWeight: 900, fontSize: 15 }}>{p.title}</div>
                      <div style={{ color: "#9c97b3", fontSize: 12, marginBottom: 6 }}>{p.subtitle}</div>
                      <div style={S.barBg}><div style={{ ...S.barFill, width: pct + "%", background: p.color }} /></div>
                    </div>
                    <div style={{ fontWeight: 900, color: p.color, fontSize: 13 }}>{pct}%</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={S.main}>
        {view === "home" && (
          <HomeMap
            path={path} pathNodes={pathNodes} nodeStatus={nodeStatus}
            progress={progress}
            onChapter={openChapter} onTest={openTest}
          />
        )}

        {view === "chapter" && active && (
          <ChapterView
            path={path} active={active}
            onQuiz={chapterToQuiz} onBack={backHome}
          />
        )}

        {view === "quiz" && quiz && (
          <QuizView path={path} quiz={quiz} onPick={pick} onNext={nextQ} onQuit={backHome} />
        )}

        {view === "result" && quiz && quiz.done && (
          <ResultView path={path} quiz={quiz} onHome={backHome}
            onRetry={() => startQuiz(quiz.lesson, quiz.chapter, quiz.mode)} />
        )}

        {view === "profile" && (
          <ProfileView progress={progress} lv={lv} onBack={backHome} />
        )}
      </div>

      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}

/* -------------------- Home path map -------------------- */
function HomeMap({ path, pathNodes, nodeStatus, progress, onChapter, onTest }) {
  const teacher = T[path.teacher];
  // group nodes by lesson for headers
  const groups = [];
  path.lessons.forEach((lesson, li) => {
    const start = pathNodes.findIndex((n) => n.lesson.id === lesson.id);
    const items = pathNodes.filter((n) => n.lesson.id === lesson.id).map((n) => ({ ...n, gi: pathNodes.indexOf(n) }));
    groups.push({ lesson, li, items });
  });

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* path banner */}
      <div style={{ ...S.banner, background: `linear-gradient(135deg, ${path.color}, ${shade(path.color, -18)})` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.85, letterSpacing: 1 }}>YOUR GUIDE</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>{teacher.name}</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>{teacher.tag}</div>
        </div>
        <div className="pp-float"><Avatar cfg={teacher.cfg} size={84} /></div>
      </div>

      {groups.map(({ lesson, items }) => {
        const lessonTeacher = T[lesson.teacher] || teacher;
        const test = progress.tests[lesson.id];
        return (
          <div key={lesson.id} style={{ marginTop: 22 }}>
            <div style={S.lessonHead}>
              <div style={{ ...S.lessonDot, background: path.color }} />
              <div style={{ fontWeight: 900, fontSize: 15 }}>{lesson.title}</div>
              {test && test.passed && <span style={S.crown}>👑</span>}
            </div>
            <div style={S.track}>
              {items.map((n, idx) => {
                const status = nodeStatus(n.gi);
                const offset = Math.sin(idx * 1.1) * 46; // gentle wave
                return (
                  <div key={n.id} style={{ ...S.nodeRow, transform: `translateX(${offset}px)` }}>
                    <PathNode
                      node={n} status={status} color={path.color}
                      teacher={lessonTeacher}
                      onClick={() => {
                        if (status === "locked") return;
                        if (n.kind === "chapter") onChapter(n.chapter, n.lesson);
                        else onTest(n.lesson);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PathNode({ node, status, color, teacher, onClick }) {
  const isTest = node.kind === "test";
  const label = isTest ? "Checkpoint" : node.chapter.title;
  const face = status === "done" ? "✓" : isTest ? "🏆" : "★";
  const bg = status === "locked" ? "#e7e4f0" : status === "done" ? "#f6b93b" : color;
  const ring = status === "current" ? `0 0 0 6px ${color}22` : "none";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {status === "current" && <div style={S.startPill}>{isTest ? "TEST" : "START"}</div>}
      <button
        className={status === "locked" ? "" : "pp-press pp-node"}
        onClick={onClick}
        disabled={status === "locked"}
        aria-label={label + " (" + status + ")"}
        style={{
          ...S.node,
          background: bg,
          boxShadow: status === "locked" ? "0 5px 0 #cdc8dc" : `0 6px 0 ${shade(bg, -20)}, ${ring}`,
          cursor: status === "locked" ? "not-allowed" : "pointer",
          opacity: status === "locked" ? 0.75 : 1,
        }}
      >
        <span style={{ fontSize: isTest ? 30 : 28, filter: status === "locked" ? "grayscale(1)" : "none" }}>
          {status === "locked" ? "🔒" : face}
        </span>
      </button>
      <div style={{ ...S.nodeLabel, color: status === "locked" ? "#b3aec6" : "#5b5470" }}>{label}</div>
    </div>
  );
}

/* -------------------- Chapter (learning) view -------------------- */
function ChapterView({ path, active, onQuiz, onBack }) {
  const { chapter, lesson } = active;
  const teacher = T[lesson.teacher] || T[path.teacher];
  const [i, setI] = useState(0);
  const card = chapter.cards[i];
  const last = i === chapter.cards.length - 1;
  const kindStyle = {
    idea: { tag: "CORE IDEA", color: path.color },
    eg: { tag: "EXAMPLE", color: "#0984E3" },
    tip: { tag: "TIP", color: "#12B3A6" },
    name: { tag: "KEY TERM", color: "#9B59B6" },
  }[card.t] || { tag: "NOTE", color: path.color };

  return (
    <div style={{ paddingBottom: 24 }}>
      <TopBar onBack={onBack} title={chapter.title} sub={lesson.title} color={path.color} />
      <div style={S.progressLine}>
        {chapter.cards.map((_, k) => (
          <div key={k} style={{ ...S.progDot, background: k <= i ? path.color : "#e7e4f0", flex: 1 }} />
        ))}
      </div>

      <div style={S.teachRow}>
        <div className="pp-float-s"><Avatar cfg={teacher.cfg} size={64} /></div>
        <div style={S.speech}>
          <div style={{ fontWeight: 900, fontSize: 12, color: kindStyle.color, letterSpacing: 0.6 }}>{kindStyle.tag}</div>
          <div style={{ fontWeight: 900, fontSize: 17, marginTop: 2 }}>{card.h}</div>
        </div>
      </div>

      <div key={i} className="pp-fade" style={S.cardBody}>{card.b}</div>

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        {i > 0 && (
          <button className="pp-press" onClick={() => setI(i - 1)} style={S.btnGhost}>Back</button>
        )}
        {!last ? (
          <button className="pp-press" onClick={() => setI(i + 1)} style={{ ...S.btnMain, background: path.color, boxShadow: `0 5px 0 ${shade(path.color, -22)}`, flex: 1 }}>
            Continue
          </button>
        ) : (
          <button className="pp-press" onClick={onQuiz} style={{ ...S.btnMain, background: "#f6b93b", boxShadow: "0 5px 0 #d89a1f", flex: 1 }}>
            Take the quick test →
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------- Quiz view -------------------- */
function QuizView({ path, quiz, onPick, onNext, onQuit }) {
  const q = quiz.qs[quiz.i];
  const isBig = quiz.mode === "big";
  const pct = (quiz.i / quiz.qs.length) * 100;
  return (
    <div className={quiz.wrong ? "pp-shake" : ""} style={{ paddingBottom: 24 }}>
      <div style={S.quizTop}>
        <button className="pp-press" onClick={onQuit} style={S.xBtn} aria-label="Quit">✕</button>
        <div style={S.quizBarBg}>
          <div style={{ ...S.quizBarFill, width: pct + "%", background: isBig ? "#f6b93b" : path.color }} />
        </div>
        <div style={{ fontWeight: 900, color: "#9c97b3", fontSize: 13, width: 40, textAlign: "right" }}>
          {quiz.i + 1}/{quiz.qs.length}
        </div>
      </div>

      <div style={{ ...S.quizTag, color: isBig ? "#d89a1f" : path.color }}>
        {isBig ? "🏆 LESSON CHECKPOINT" : "QUICK TEST"}
      </div>
      <div style={S.question}>{q.q}</div>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {q.o.map((opt, idx) => {
          let bg = "#fff", border = "#e7e4f0", col = "#3a3550";
          if (quiz.revealed) {
            if (idx === q.a) { bg = "#e9f9ef"; border = "#39c46a"; col = "#1f8a45"; }
            else if (idx === quiz.picked) { bg = "#fdecec"; border = "#ef5350"; col = "#c62828"; }
          } else if (quiz.picked === idx) { border = path.color; }
          return (
            <button
              key={idx}
              className={quiz.revealed ? "" : "pp-press"}
              onClick={() => onPick(idx)}
              disabled={quiz.revealed}
              style={{ ...S.option, background: bg, borderColor: border, color: col,
                cursor: quiz.revealed ? "default" : "pointer" }}
            >
              <span style={{ ...S.optKey, borderColor: border, color: col }}>{"ABCD"[idx]}</span>
              <span style={{ fontWeight: 800, textAlign: "left" }}>{opt}</span>
              {quiz.revealed && idx === q.a && <span style={{ marginLeft: "auto" }}>✓</span>}
            </button>
          );
        })}
      </div>

      {quiz.revealed && (
        <div className="pp-fade" style={{ ...S.explain,
          background: quiz.picked === q.a ? "#e9f9ef" : "#fff6f6",
          borderColor: quiz.picked === q.a ? "#bfe9cd" : "#f8c9c9" }}>
          <div style={{ fontWeight: 900, color: quiz.picked === q.a ? "#1f8a45" : "#c62828", marginBottom: 4 }}>
            {quiz.picked === q.a ? "Correct!" : "Not quite"}
          </div>
          <div style={{ color: "#5b5470", fontSize: 14 }}>{q.e}</div>
        </div>
      )}

      {quiz.revealed && (
        <button className="pp-press" onClick={onNext}
          style={{ ...S.btnMain, width: "100%", marginTop: 16,
            background: quiz.picked === q.a ? "#39c46a" : path.color,
            boxShadow: `0 5px 0 ${shade(quiz.picked === q.a ? "#39c46a" : path.color, -22)}` }}>
          {quiz.i + 1 === quiz.qs.length ? "Finish" : "Continue"}
        </button>
      )}
    </div>
  );
}

/* -------------------- Result view -------------------- */
function ResultView({ path, quiz, onHome, onRetry }) {
  const teacher = T[quiz.lesson.teacher] || T[path.teacher];
  const acc = Math.round((quiz.correctFinal / quiz.total) * 100);
  const isBig = quiz.mode === "big";
  const good = quiz.passed && (!isBig || acc >= 70);
  const line = isBig
    ? (quiz.passed ? "Checkpoint cleared. The next lesson is open." : `You need ${Math.ceil(quiz.total * PASS_RATIO)}/${quiz.total} to pass — give it another go.`)
    : (acc === 100 ? "Flawless. That concept is yours." : "Nice work — chapter complete.");

  return (
    <div style={S.center}>
      <div className="pp-pop" style={{ fontSize: 64, marginBottom: 4 }}>
        {good ? (isBig ? "🏆" : "🎉") : "💪"}
      </div>
      <div style={{ fontWeight: 900, fontSize: 24 }}>
        {good ? (isBig ? "Checkpoint passed!" : "Chapter done!") : "Almost there"}
      </div>

      <div style={{ display: "flex", gap: 12, margin: "18px 0 6px" }}>
        <ResultStat label="Accuracy" value={acc + "%"} color={path.color} />
        <ResultStat label="XP earned" value={"+" + quiz.earned} color="#f6b93b" />
        <ResultStat label="Score" value={quiz.correctFinal + "/" + quiz.total} color="#12B3A6" />
      </div>

      <div style={S.teachCard}>
        <Avatar cfg={teacher.cfg} size={52} />
        <div style={{ fontSize: 14, color: "#5b5470", fontWeight: 700 }}>{line}</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18, width: "100%" }}>
        {!good && (
          <button className="pp-press" onClick={onRetry} style={{ ...S.btnMain, flex: 1, background: path.color, boxShadow: `0 5px 0 ${shade(path.color, -22)}` }}>
            Try again
          </button>
        )}
        <button className="pp-press" onClick={onHome} style={{ ...S.btnMain, flex: 1,
          background: good ? "#39c46a" : "#fff",
          color: good ? "#fff" : "#5b5470",
          border: good ? "none" : "2px solid #e7e4f0",
          boxShadow: good ? "0 5px 0 #2ba557" : "none" }}>
          {good ? "Continue" : "Back to path"}
        </button>
      </div>
    </div>
  );
}

/* -------------------- Profile view -------------------- */
function ProfileView({ progress, lv, onBack }) {
  const chaptersDone = Object.keys(progress.chapters).length;
  const testsPassed = Object.values(progress.tests).filter((t) => t.passed).length;
  return (
    <div style={{ paddingBottom: 24 }}>
      <TopBar onBack={onBack} title="Your progress" sub="Patty · Master Psychology prep" color="#6C5CE7" />

      <div style={S.levelCard}>
        <div style={{ fontSize: 46 }}>🧠</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>Level {lv.level}</div>
          <div style={S.barBg}><div style={{ ...S.barFill, width: (lv.into / lv.span) * 100 + "%", background: "#6C5CE7" }} /></div>
          <div style={{ color: "#9c97b3", fontSize: 12, marginTop: 4 }}>{lv.into} / {lv.span} XP to level {lv.level + 1}</div>
        </div>
      </div>

      <div style={S.metricRow}>
        <Metric icon="⭐" value={progress.xp} label="Total XP" />
        <Metric icon="🔥" value={progress.streak} label="Day streak" />
        <Metric icon="📖" value={chaptersDone} label="Chapters" />
        <Metric icon="🏆" value={testsPassed} label="Checkpoints" />
      </div>

      <div style={{ fontWeight: 900, fontSize: 15, margin: "22px 0 10px" }}>Paths</div>
      {PATHS.map((p) => {
        const pct = pathPct(p, progress);
        return (
          <div key={p.id} style={S.pathProgRow}>
            <div style={{ ...S.pathIcon, background: p.color + "1f", color: p.color, width: 40, height: 40, fontSize: 20 }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{p.title}</div>
              <div style={S.barBg}><div style={{ ...S.barFill, width: pct + "%", background: p.color }} /></div>
            </div>
            <div style={{ fontWeight: 900, color: p.color, fontSize: 13, width: 40, textAlign: "right" }}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- Small components -------------------- */
function Stat({ icon, value, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontWeight: 900, color }}>{value}</span>
    </div>
  );
}
function ResultStat({ label, value, color }) {
  return (
    <div style={{ ...S.resultStat }}>
      <div style={{ fontWeight: 900, fontSize: 22, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9c97b3", fontWeight: 800, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
    </div>
  );
}
function Metric({ icon, value, label }) {
  return (
    <div style={S.metric}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontWeight: 900, fontSize: 20 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9c97b3", fontWeight: 800 }}>{label}</div>
    </div>
  );
}
function TopBar({ onBack, title, sub, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <button className="pp-press" onClick={onBack} style={S.backBtn} aria-label="Back">←</button>
      <div>
        <div style={{ fontWeight: 900, fontSize: 17 }}>{title}</div>
        {sub && <div style={{ color: "#9c97b3", fontSize: 12, fontWeight: 700 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* -------------------- utilities -------------------- */
function pathPct(p, progress) {
  let total = 0, done = 0;
  p.lessons.forEach((l) => {
    l.chapters.forEach((c) => { total++; if (progress.chapters[c.id]) done++; });
    total++; if (progress.tests[l.id] && progress.tests[l.id].passed) done++;
  });
  return total ? Math.round((done / total) * 100) : 0;
}
function shade(hex, amt) {
  const c = hex.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* -------------------- styles + css -------------------- */
function StyleTag() {
  return (
    <style>{`
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      .pp-press { transition: transform .06s ease; }
      .pp-press:active { transform: translateY(3px); }
      .pp-node:hover { transform: translateY(-2px); }
      .pp-chip { border: none; cursor: pointer; font-family: inherit; }
      @keyframes ppPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
      .pp-pulse { animation: ppPulse 1.1s ease-in-out infinite; }
      @keyframes ppFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
      .pp-float { animation: ppFloat 3s ease-in-out infinite; }
      .pp-float-s { animation: ppFloat 3.4s ease-in-out infinite; }
      @keyframes ppPop { 0%{transform:scale(.4);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
      .pp-pop { animation: ppPop .5s cubic-bezier(.2,.8,.3,1.2) both; }
      @keyframes ppFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      .pp-fade { animation: ppFade .28s ease both; }
      @keyframes ppShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
      .pp-shake { animation: ppShake .4s ease; }
      @media (prefers-reduced-motion: reduce) {
        .pp-pulse,.pp-float,.pp-float-s,.pp-pop,.pp-fade,.pp-shake { animation: none !important; }
      }
      button:focus-visible { outline: 3px solid #6C5CE7aa; outline-offset: 2px; }
    `}</style>
  );
}

const S = {
  appWrap: {
    fontFamily: "Nunito, ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, sans-serif",
    maxWidth: 480, margin: "0 auto", minHeight: "100vh",
    background: "#f7f5fc", color: "#2f2a3d", position: "relative", overflow: "hidden",
  },
  hud: {
    position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 8, padding: "12px 16px",
    background: "rgba(247,245,252,.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid #eceaf5",
  },
  pathChip: {
    display: "flex", alignItems: "center", gap: 7, color: "#fff",
    padding: "8px 12px", borderRadius: 14, fontSize: 14, maxWidth: 200,
  },
  stats: { display: "flex", alignItems: "center", gap: 12 },
  lvlBtn: {
    background: "#efeaff", color: "#6C5CE7", padding: "7px 11px", borderRadius: 12, fontSize: 13,
  },
  main: { padding: "16px 18px 90px" },

  banner: {
    display: "flex", alignItems: "center", gap: 12, color: "#fff",
    padding: "16px 18px", borderRadius: 22, boxShadow: "0 10px 24px rgba(80,60,160,.18)",
  },
  lessonHead: { display: "flex", alignItems: "center", gap: 8, margin: "0 0 6px 4px" },
  lessonDot: { width: 10, height: 10, borderRadius: 6 },
  crown: { marginLeft: 4 },
  track: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 0" },
  nodeRow: { transition: "transform .3s ease" },
  node: {
    width: 78, height: 72, borderRadius: 40, border: "none", display: "flex",
    alignItems: "center", justifyContent: "center", color: "#fff",
  },
  nodeLabel: { fontSize: 11.5, fontWeight: 800, maxWidth: 120, textAlign: "center", lineHeight: 1.2 },
  startPill: {
    background: "#fff", color: "#39c46a", fontWeight: 900, fontSize: 11, letterSpacing: 1,
    padding: "3px 10px", borderRadius: 10, boxShadow: "0 3px 8px rgba(0,0,0,.08)",
  },

  progressLine: { display: "flex", gap: 5, margin: "0 0 18px" },
  progDot: { height: 7, borderRadius: 4 },

  teachRow: { display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 6 },
  speech: {
    background: "#fff", borderRadius: "16px 16px 16px 4px", padding: "12px 14px",
    boxShadow: "0 4px 14px rgba(80,60,160,.08)", flex: 1,
  },
  cardBody: {
    background: "#fff", borderRadius: 18, padding: "18px 18px", fontSize: 16, lineHeight: 1.55,
    color: "#3a3550", fontWeight: 600, boxShadow: "0 4px 14px rgba(80,60,160,.06)", marginTop: 8,
  },

  quizTop: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  xBtn: { background: "none", border: "none", fontSize: 20, color: "#b3aec6", cursor: "pointer", fontWeight: 900 },
  quizBarBg: { flex: 1, height: 14, background: "#e7e4f0", borderRadius: 8, overflow: "hidden" },
  quizBarFill: { height: "100%", borderRadius: 8, transition: "width .3s ease" },
  quizTag: { fontWeight: 900, fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  question: { fontSize: 21, fontWeight: 900, lineHeight: 1.3, color: "#2f2a3d" },
  option: {
    display: "flex", alignItems: "center", gap: 12, padding: "15px 15px",
    borderRadius: 16, border: "2px solid", fontSize: 15.5, fontWeight: 800, fontFamily: "inherit",
  },
  optKey: {
    width: 28, height: 28, borderRadius: 8, border: "2px solid", display: "flex",
    alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0,
  },
  explain: { marginTop: 16, padding: "13px 15px", borderRadius: 14, border: "2px solid" },

  center: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 24 },
  resultStat: {
    background: "#fff", borderRadius: 16, padding: "12px 8px", minWidth: 92, flex: 1,
    boxShadow: "0 4px 14px rgba(80,60,160,.06)",
  },
  teachCard: {
    display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 16,
    padding: "12px 14px", boxShadow: "0 4px 14px rgba(80,60,160,.06)", marginTop: 8, width: "100%", textAlign: "left",
  },

  btnMain: {
    border: "none", color: "#fff", fontWeight: 900, fontSize: 16, padding: "14px 18px",
    borderRadius: 16, cursor: "pointer", fontFamily: "inherit",
  },
  btnGhost: {
    border: "2px solid #e7e4f0", background: "#fff", color: "#5b5470", fontWeight: 900,
    fontSize: 15, padding: "12px 18px", borderRadius: 16, cursor: "pointer", fontFamily: "inherit",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, border: "2px solid #e7e4f0", background: "#fff",
    fontSize: 18, fontWeight: 900, color: "#5b5470", cursor: "pointer",
  },

  sheetWrap: {
    position: "fixed", inset: 0, background: "rgba(30,20,60,.35)", zIndex: 40,
    display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "72px 14px 14px",
  },
  sheet: {
    background: "#fff", borderRadius: 22, padding: 18, width: "100%", maxWidth: 452,
    boxShadow: "0 20px 50px rgba(30,20,60,.3)", maxHeight: "80vh", overflowY: "auto",
  },
  pathGrid: { display: "flex", flexDirection: "column", gap: 10 },
  pathCard: {
    display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 16,
    border: "2px solid #eceaf5", background: "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
  },
  pathIcon: {
    width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 22, flexShrink: 0,
  },
  barBg: { height: 8, background: "#eceaf5", borderRadius: 6, overflow: "hidden", marginTop: 4 },
  barFill: { height: "100%", borderRadius: 6, transition: "width .4s ease" },

  levelCard: {
    display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 20,
    padding: 16, boxShadow: "0 6px 18px rgba(80,60,160,.08)",
  },
  metricRow: { display: "flex", gap: 10, marginTop: 12 },
  metric: {
    flex: 1, background: "#fff", borderRadius: 16, padding: "12px 6px", textAlign: "center",
    boxShadow: "0 4px 12px rgba(80,60,160,.05)",
  },
  pathProgRow: {
    display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 14,
    padding: "10px 12px", marginBottom: 8, boxShadow: "0 3px 10px rgba(80,60,160,.04)",
  },

  toast: {
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    background: "#2f2a3d", color: "#fff", padding: "10px 18px", borderRadius: 14,
    fontWeight: 800, fontSize: 14, zIndex: 60, boxShadow: "0 8px 24px rgba(0,0,0,.25)",
  },
};
