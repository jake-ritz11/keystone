"use client";

import { useState } from "react";
import { RATING_STATEMENTS, type Rating } from "@keystone-ui/agent-core";
import { Button, SegmentedControl } from "@keystone-ui/ui";
import styles from "./study.module.css";

const SCALE = ["1", "2", "3", "4", "5"] as const;
type Point = (typeof SCALE)[number];

/** Three statements on a 1-5 agreement scale, after a task. Skippable, never blocking. */
export function RatingCard({ onSubmit, onSkip }: { onSubmit: (rating: Rating) => void; onSkip: () => void }) {
  const [answers, setAnswers] = useState<Partial<Record<keyof Rating, Point>>>({});
  const keys = Object.keys(RATING_STATEMENTS) as (keyof Rating)[];
  const complete = keys.every((k) => answers[k]);

  return (
    <section className={styles.rating} aria-labelledby="rating-heading">
      <h2 id="rating-heading" className={styles.heading}>
        How did that go?
      </h2>
      <p className={styles.text}>1 is strongly disagree, 5 is strongly agree.</p>
      {keys.map((key) => (
        <div key={key} className={styles.statement}>
          <span id={`rating-${key}`} className={styles.statementText}>
            {RATING_STATEMENTS[key]}
          </span>
          <SegmentedControl
            aria-label={RATING_STATEMENTS[key]}
            size="sm"
            value={answers[key] ?? ("" as Point)}
            onValueChange={(v) => setAnswers((a) => ({ ...a, [key]: v }))}
            options={SCALE.map((p) => ({ value: p, label: p }))}
          />
        </div>
      ))}
      <div className={styles.ratingActions}>
        <Button variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        <Button
          disabled={!complete}
          onClick={() => onSubmit({ control: Number(answers.control), trust: Number(answers.trust), effort: Number(answers.effort) })}
        >
          Save answers
        </Button>
      </div>
    </section>
  );
}
