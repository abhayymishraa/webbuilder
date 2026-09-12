import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="ember-brand" aria-label="WebBuilder home">
      <svg viewBox="0 0 100 100" width={30} height={30} aria-hidden="true" focusable="false">
        <use href="/brand/webbuilder-mark.svg#mark" />
      </svg>
      <span>webbuilder</span>
    </Link>
  );
}

export function EmberArtwork() {
  return (
    <figure className="ember-art" aria-label="Make your next move">
      <div className="ember-art-top">
        <span>webbuilder</span>
        <span>From idea to interface</span>
      </div>
      <p className="ember-art-title">
        Make your
        <br />
        next move.
      </p>
      <figcaption>
        Direct. Confident.
        <br />
        Ready to build.
      </figcaption>
    </figure>
  );
}
