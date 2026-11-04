"use client";
import ArrowIcon from "@/components/arrow-icon";
import { useRef, useState } from "react";
type Fields = {
  name: string;
  email: string;
  interest: string;
  message: string;
};
const initial: Fields = {
  name: "",
  email: "",
  interest: "General enquiry",
  message: "",
};
export default function ContactForm({
  email,
  initialInterest = "General enquiry",
  initialMessage = "",
}: {
  email: string;
  initialInterest?: string;
  initialMessage?: string;
}) {
  const [fields, setFields] = useState<Fields>(() => ({
    ...initial,
    interest: initialInterest,
    message: initialMessage,
  }));
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [prepared, setPrepared] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  function update(key: keyof Fields, value: string) {
    setFields({ ...fields, [key]: value });
    setPrepared(false);
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Fields> = {};
    if (!fields.name.trim()) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
      next.email = "Please enter a valid email address.";
    if (fields.message.trim().length < 15)
      next.message =
        "Please write at least 15 characters so we can understand your enquiry.";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    setPrepared(true);
  }
  const draft = `mailto:${email}?subject=${encodeURIComponent(`${fields.interest} — ${fields.name.trim()}`)}&body=${encodeURIComponent(`Name: ${fields.name.trim()}\nReply email: ${fields.email.trim()}\n\n${fields.message.trim()}`)}`;
  return (
    <form className="contact-form" noValidate onSubmit={submit} ref={form}>
      <h2>A conversation starts here.</h2>
      <p className="form-explanation">
        Prepare an email to the foundation. Your message will open in your email
        app for you to send.
      </p>
      <div className="form-two">
        <div>
          <label htmlFor="contact-name">
            Your name <span>(required)</span>
          </label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            value={fields.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name ? (
            <p className="field-error" id="name-error">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="contact-email">
            Email address <span>(required)</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={fields.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email ? (
            <p className="field-error" id="email-error">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>
      <label htmlFor="contact-interest">I’d like to talk about</label>
      <select
        id="contact-interest"
        name="interest"
        value={fields.interest}
        onChange={(event) => update("interest", event.target.value)}
      >
        {[
          "General enquiry",
          "Joining a program",
          "Volunteering",
          "Supporting an initiative",
          "Community collaboration",
        ].map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <label htmlFor="contact-message">
        Your message <span>(required)</span>
      </label>
      <textarea
        id="contact-message"
        name="message"
        rows={5}
        required
        maxLength={1500}
        value={fields.message}
        onChange={(event) => update("message", event.target.value)}
        aria-invalid={!!errors.message}
        aria-describedby={errors.message ? "message-error" : undefined}
      />
      {errors.message ? (
        <p className="field-error" id="message-error">
          {errors.message}
        </p>
      ) : null}
      <button className="action" type="submit">
        Prepare my email{" "}
        <span aria-hidden="true">
          <ArrowIcon />
        </span>
      </button>
      <p className="form-privacy">
        This form does not submit or store your message. Prefer to write
        directly? <a href={`mailto:${email}`}>Email the foundation.</a>
      </p>
      {prepared ? (
        <div className="form-result" role="status">
          <h3>Your email is ready to open.</h3>
          <p>
            Nothing has been sent. Use the link below, review your message in
            your email app, and send it when you’re ready.
          </p>
          <a className="text-link" href={draft}>
            Open my email draft{" "}
            <span aria-hidden="true">
              <ArrowIcon />
            </span>
          </a>
        </div>
      ) : null}
    </form>
  );
}
