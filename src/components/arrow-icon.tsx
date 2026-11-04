type Direction = "up-right" | "up" | "down" | "left" | "right";

const paths: Record<Direction, string> = {
  "up-right": "M7 17 17 7M7 7h10v10",
  up: "M12 20V4m-7 7 7-7 7 7",
  down: "M12 4v16m-7-7 7 7 7-7",
  left: "M20 12H4m7-7-7 7 7 7",
  right: "M4 12h16m-7-7 7 7-7 7",
};

/** Decorative navigation mark: labels belong to the containing link or button. */
export default function ArrowIcon({
  direction = "up-right",
}: {
  direction?: Direction;
}) {
  return (
    <svg
      className="arrow-icon"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[direction]} />
    </svg>
  );
}
