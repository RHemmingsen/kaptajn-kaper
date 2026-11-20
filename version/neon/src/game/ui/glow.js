// The neon glow: everything drawn gets a soft halo in its own colour.
//
// Rather than change every drawing function, addGlow wraps the drawing
// methods of one canvas context, once, at the start: before each fill,
// stroke or text, it sets the context's shadow to the colour about to be
// drawn, and turns it off again after. (The pattern: a decorator. It changes
// this one context object, not the browser's canvas in general, and the
// drawing code in ui/ doesn't know it's there.)
//
// The background colour gets no glow, and neither do gradients and patterns
// (the synthwave sky), which have no single colour to glow in.
const BLUR = 12; // pixels of halo around shapes and lines
const TEXT_BLUR = 8; // and around text, a little less, so it stays readable

export function addGlow(ctx, { background }) {
  for (const name of ['fill', 'stroke', 'fillText', 'fillRect', 'strokeRect']) {
    const draw = ctx[name].bind(ctx);
    ctx[name] = (...args) => {
      const style = name.startsWith('stroke') ? ctx.strokeStyle : ctx.fillStyle;
      const glows = typeof style === 'string' && style !== background;
      ctx.shadowColor = glows ? style : 'transparent';
      ctx.shadowBlur = glows ? (name === 'fillText' ? TEXT_BLUR : BLUR) : 0;
      draw(...args);
      ctx.shadowBlur = 0;
    };
  }
}
