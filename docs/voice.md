# Voice

How the long-form writing in this project is written: the case study, the decisions, the
comparison and the other pages under Writing, the README, and the explanatory notes on the docs
pages. Interface copy has its own rules in the [content guidelines](content-guidelines.md).

The voice is modelled on student theses in HCI and software engineering. They do the same job
this writing does: report what was built and tested, explain the choices made along the way,
and say honestly what remains unproven. I read the key sections of six of them (listed at the
end) and measured them. The four written before 2022 average 20 to 26 words per sentence with
a wide spread, use no em dashes, and put their hedges only on interpretation, never on what was
counted. The one written in 2024 uses the words that large language models overuse (delve,
robust, crucial, in the realm of) 5.7 times per thousand words, against 0.04 to 0.8 in the
earlier four.

## The rules

### One pronoun, used for what the author did

This project has one author, so it says "I": I built, I measured, I expected. "I" marks who did
or judged something. It is not used to sound personal, and the subject of a sentence is usually
the work rather than me. Procedure that nobody needs to own can be passive ("the tests run on
every push").

### Claim, then evidence, then what it means

A paragraph opens with what it is about, gives the evidence, and ends with the consequence if
there is one. The theses do this in nearly every paragraph. One of them opens each conclusion
with a short claim and supports it over the next few sentences.

### Numbers, with what they are out of

Results are stated with their counts and denominators, and stated flatly: 3 of the 12 NVDA
checks, 114 screenshots, 776 tests. A number with no denominator ("several bugs") is replaced
with the count when the count is known.

### Hedge interpretation, not observation

What was done and what was measured is stated without hedging. Hedges (may, might, probably,
suggests) go on interpretation and prediction: why NVDA might read a dialog twice, what the
study might show. A paragraph that hedges everything says nothing; one that hedges nothing
claims too much.

### A decision comes with its reason

Each choice is stated with its reason, in the same sentence where possible: "I built the
overlays on the native `<dialog>` and `popover` because the browser then handles focus and
dismissal." If the decision had a cost, the cost is in the next sentence.

### Limitations name a cause and an effect

"Nobody has used it yet" is a start. The full form says why and what it changes: the study needs
the deployed app, so every expectation in the variants is still a guess. A limitation is never
followed by reassurance that it does not matter.

### Plain transitions, varied sentences

The connectives are the ordinary ones: however, so, therefore, because, that is, in other words.
Sentences vary in length. A long sentence can carry a procedure; a short one can carry a result.

### One name for one thing

A thing gets one name and keeps it. If the agent's change to a file is an "edit", it stays an
edit, and does not become a modification and then a change.

## What to avoid

These are the patterns Wikipedia's editors list as [signs of AI writing][wiki], narrowed to
the ones that turn up in technical prose, and checked against the earlier theses, which use
none of them.

| Pattern | Example of the tell | Write instead |
| --- | --- | --- |
| Colon reveals | "The cause turned out to be simple: …" | State the cause: "The cause was …" |
| Negative parallelism | "It's not a bug, it's a design choice"; "X, not Y" as a flourish | Say what it is. Keep "not" for a real correction of a likely misreading. |
| Triplets by default | Every list and every run of adjectives has three items | As many items as there are |
| Bold-label bullets | "- **Speed:** it's fast" | Prose, or a table when the items share columns |
| Tidy closing lines | A last sentence that restates the paragraph as a maxim | End on the last fact or its consequence |
| Inflated significance | "a pivotal step", "a testament to" | What it changed, in numbers if there are any |
| "Serves as", "stands as" | "The kit serves as the foundation" | "The app is built from the kit" |
| -ing tails | "…, ensuring that every edit is reviewed" | A separate sentence, if the claim is true |
| AI vocabulary | delve, crucial, robust, leverage, seamless, showcase, underscore | The plain word, or nothing |
| Em dashes | Asides set off with em dashes | Commas, parentheses or a new sentence |
| Vague attribution | "Research shows" | The source, linked |

Contractions are left out of this writing, as the theses leave them out. Interface copy keeps
them, because it is speech.

A list is still right for things that are a list: steps in order, criteria, a set of
components. A table is right when every row has the same columns.

## An example

Before, from the case study:

> When the cause wasn't obvious, I stopped guessing and measured. NVDA read every newly
> selected tab twice. A throwaway page built the tab pattern up one attribute at a time and CI
> recorded NVDA on each: only `aria-controls` doubled it, so Tabs dropped it.

After:

> NVDA read every newly selected tab twice, and I could not see why from the markup. I built a
> test page that added the tab pattern's attributes one at a time and had CI record what NVDA
> said after each step. The repeat appeared only once `aria-controls` was added, so I removed it
> from Tabs.

The second version is longer, and it says the same thing in the order it happened, with "I" on
the things I did and no reveal after a colon.

## Sources

The theses, read in their abstract, introduction, method, discussion and limitations sections:

- Herrera, *A Usability Study of the "Tksee" Software Exploration Tool*, MSc, University of
  Ottawa, 1999. [PDF](https://www.eecs.uottawa.ca/~tcl/gradtheses/fherrera/FHerreraThesis.pdf)
- Sohail, *Challenges in Recruiting Participants for Studies in HCI*, MSc, RWTH Aachen, 2020.
  [PDF](https://almeida.informatik.rwth-aachen.de/publications/sohail2020a.pdf)
- Stepanova, *Aligning UX designers and UI developers work with design systems*, MSc, Aalto
  University, 2021. [PDF](https://aaltodoc.aalto.fi/server/api/core/bitstreams/81dbfcd3-a8f4-4eb0-9f0b-fd7ca3fc7fed/content)
- Davidsson et al., *Positive User Experience: Redesigning Chalmers' Studentportal*, BSc,
  Chalmers, 2021. [PDF](https://odr.chalmers.se/server/api/core/bitstreams/3267d0bb-6b03-40cc-8705-f24340cf6d64/content)
- Pham, MSc, Chalmers, 2024, used as a contrast case. [Record](https://odr.chalmers.se/items/67bf2769-68b7-406f-9e4c-c15e8561ce4c/full)
- Asanovska and Lundberg, *From Evaluation to Design*, MSc, Lund University, 2026.
  [PDF](https://lup.lub.lu.se/student-papers/record/9230742/file/9230745.pdf)

On machine-written text:

- Wikipedia editors, [Signs of AI writing][wiki].
- Kobak et al., [Delving into LLM-assisted writing in biomedical publications through excess
  vocabulary](https://arxiv.org/abs/2406.07016), 2024: certain style words rose sharply in
  abstracts after 2022, and the authors estimate at least 13.5% of 2024 abstracts were processed
  with a language model.

[wiki]: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
