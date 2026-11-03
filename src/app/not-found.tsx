import { Action, Eyebrow } from "@/components/ui";
export default function NotFound() {
  return (
    <section className="not-found wrap">
      <Eyebrow>404 / A LITTLE OFF BEAT</Eyebrow>
      <h1>
        Let’s find our
        <br />
        <em>way back together.</em>
      </h1>
      <p>We couldn’t find that page. There’s still plenty to explore.</p>
      <div>
        <Action href="/">Back to home</Action>
        <Action href="/programs" secondary>
          Explore programs
        </Action>
      </div>
    </section>
  );
}
