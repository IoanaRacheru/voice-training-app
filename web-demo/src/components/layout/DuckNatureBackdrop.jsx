import React from "react";

const reeds = Array.from({ length: 12 }, (_, index) => index);

export default function DuckNatureBackdrop() {
  return (
    <div className="duck-nature-backdrop" aria-hidden="true">
      <div className="canvas-grain" />

      <div className="leaf-spray leaf-spray-left">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="leaf-spray leaf-spray-right">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="storybook-flower flower-one">
        <span />
      </div>
      <div className="storybook-flower flower-two">
        <span />
      </div>
      <div className="storybook-flower flower-three">
        <span />
      </div>

      <div className="floating-duck floating-duck-large">
        <span className="duck-body" />
        <span className="duck-head" />
        <span className="duck-beak" />
        <span className="duck-eye" />
      </div>

      <div className="floating-duck floating-duck-small">
        <span className="duck-body" />
        <span className="duck-head" />
        <span className="duck-beak" />
        <span className="duck-eye" />
      </div>

      <div className="pond-band">
        {reeds.map((reed) => (
          <span key={reed} className={`reed reed-${reed + 1}`} />
        ))}
      </div>
    </div>
  );
}
