/** Plots a cubic-bezier() token as its curve: time across, progress up. Overshoot shows above the box. */
export function EasingCurve({ name, value }: { name: string; value: string }) {
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = (value.match(/-?[\d.]+/g) ?? []).map(Number);
  // A 100×100 box, flipped so progress goes up, with room above for overshoot.
  const y = (v: number) => 100 - v * 100;
  const path = `M0 ${y(0)} C${x1 * 100} ${y(y1)} ${x2 * 100} ${y(y2)} 100 ${y(1)}`;
  return (
    <figure className="easing">
      <svg viewBox="-6 -40 112 152" role="img" aria-label={`${name}: ${value}`}>
        <rect x="0" y="0" width="100" height="100" className="easing-box" />
        <line x1="0" y1={y(0)} x2={x1 * 100} y2={y(y1)} className="easing-handle" />
        <line x1="100" y1={y(1)} x2={x2 * 100} y2={y(y2)} className="easing-handle" />
        <path d={path} className="easing-curve" />
        <circle cx={x1 * 100} cy={y(y1)} r="2.5" className="easing-point" />
        <circle cx={x2 * 100} cy={y(y2)} r="2.5" className="easing-point" />
      </svg>
      <figcaption>
        <code>{name}</code>
        <span>{value}</span>
      </figcaption>
    </figure>
  );
}
