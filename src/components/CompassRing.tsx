export default function CompassRing() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
      id="compass-ring"
    >
      <defs>
        <line
          id="compass-ring-line-major"
          x1="30"
          y1="5"
          x2="30"
          y2="10"
          stroke="white"
          strokeWidth="1.5"
        />
        <line
          id="compass-ring-line-minor"
          x1="30"
          y1="5"
          x2="30"
          y2="10"
          stroke="var(--gray-7)"
          strokeWidth="1.5"
        />
      </defs>

      <circle cx="30" cy="30" r="30" fill="var(--gray-10)" />

      <polygon points="30,3 33,10 27,10" fill="var(--red-6)" />

      <use href="#compass-ring-line-minor" transform="rotate(22.5 30 30)" />
      <use href="#compass-ring-line-minor" transform="rotate(45 30 30)" />
      <use href="#compass-ring-line-minor" transform="rotate(67.5 30 30)" />

      <use href="#compass-ring-line-major" transform="rotate(90 30 30)" />

      <use href="#compass-ring-line-minor" transform="rotate(112.5 30 30)" />
      <use href="#compass-ring-line-minor" transform="rotate(135 30 30)" />
      <use href="#compass-ring-line-minor" transform="rotate(157.5 30 30)" />

      <use href="#compass-ring-line-major" transform="rotate(180 30 30)" />

      <use href="#compass-ring-line-minor" transform="rotate(202.5 30 30)" />
      <use href="#compass-ring-line-minor" transform="rotate(225 30 30)" />
      <use href="#compass-ring-line-minor" transform="rotate(247.5 30 30)" />

      <use href="#compass-ring-line-major" transform="rotate(270 30 30)" />

      <use href="#compass-ring-line-minor" transform="rotate(292.5 30 30)" />
      <use href="#compass-ring-line-minor" transform="rotate(315 30 30)" />
      <use href="#compass-ring-line-minor" transform="rotate(337.5 30 30)" />
    </svg>
  );
}
