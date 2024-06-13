export default function CompassPointer() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
      id="compass-pointer"
    >
      <polygon points="30,3 33,10 27,10" fill="var(--blue-6)" />
      <line
        x1="30"
        y1="10"
        x2="30"
        y2="55"
        stroke="var(--blue-8)"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
    </svg>
  );
}
