import { forwardRef, useImperativeHandle, useRef, useState } from "react";

let sparkSeq = 0;

const SparkleLayer = forwardRef(function SparkleLayer(_props, ref) {
  const [sparks, setSparks] = useState([]);
  const layerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    spawn(x, y) {
      const count = 7 + Math.floor(Math.random() * 4);
      const created = [];

      for (let i = 0; i < count; i++) {
        const dx = (Math.random() * 40 - 20).toFixed(1) + "px";
        const dy = (Math.random() * 52 - 34).toFixed(1) + "px";
        const size = 8 + Math.random() * 8;
        const star = Math.random() < 0.35;

        created.push({
          id: `s${sparkSeq++}`,
          x,
          y,
          dx,
          dy,
          size,
          star,
        });
      }

      setSparks((cur) => [...cur, ...created]);
    },
    clear() {
      setSparks([]);
    },
  }));

  return (
    <div ref={layerRef} className="pointer-events-none fixed inset-0 z-50">
      {sparks.map((s) => (
        <div
          key={s.id}
          className={
            "absolute rounded-full opacity-0 [mix-blend-mode:screen] animate-spark " +
            (s.star
              ? "[clip-path:polygon(50%_0%,62%_36%,100%_50%,62%_64%,50%_100%,38%_64%,0%_50%,38%_36%)] rounded-none [background:radial-gradient(circle,rgba(255,255,255,.95),rgba(255,120,182,.65)_55%,rgba(255,120,182,0)_78%)] [filter:blur(.1px)]"
              : "[background:radial-gradient(circle_at_30%_30%,rgba(255,255,255,.95),rgba(255,120,182,.75)_45%,rgba(255,120,182,0)_72%)] [filter:blur(.2px)]")
          }
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            "--dx": s.dx,
            "--dy": s.dy,
            transform: "translate(-50%, -50%) scale(.6)",
          }}
          onAnimationEnd={() => {
            setSparks((cur) => cur.filter((it) => it.id !== s.id));
          }}
        />
      ))}
    </div>
  );
});

export default SparkleLayer;
