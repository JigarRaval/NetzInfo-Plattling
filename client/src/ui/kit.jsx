/**
 * kit.jsx - the reusable interface building blocks.
 *
 * One rule runs through this file: a component ALWAYS merges an incoming
 * className onto its own classes with cx(). Spreading props after className
 * would silently delete the base class and leave an unstyled element.
 */

import React from "react";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ button */
export function Button({
  children,
  icon,
  variant = "primary",
  size,
  block,
  className,
  type = "button",
  ...rest
}) {
  const variants = {
    primary: "",
    ghost: "btn--ghost",
    ok: "btn--ok",
    danger: "btn--danger",
    recording: "btn--rec",
  };
  return (
    <button
      type={type}
      className={cx(
        "btn",
        variants[variant],
        size === "sm" && "btn--sm",
        block && "btn--block",
        className
      )}
      {...rest}
    >
      {icon && (
        <span className="ico" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- card */
export function Card({ icon, title, subtitle, tail, children, className }) {
  return (
    <section className={cx("card", className)}>
      {(title || tail) && (
        <header className="card-head">
          {icon && (
            <span className="ico" aria-hidden="true">
              {icon}
            </span>
          )}
          {title && <h2>{title}</h2>}
          {tail && <div className="tail">{tail}</div>}
        </header>
      )}
      {subtitle && <p className="card-sub">{subtitle}</p>}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------- badge */
export function Badge({ tone, children, className }) {
  return (
    <span className={cx("badge", tone && `badge--${tone}`, className)}>
      {children}
    </span>
  );
}

/* --------------------------------------------------------- status banner */
export function Hero({ tone, icon, title, text }) {
  return (
    <div className={cx("hero", tone && `hero--${tone}`)}>
      <span className="hero-ico" aria-hidden="true">
        {icon}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- form field */
export function Field({ label, hint, htmlFor, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------- list row */
export function Item({ icon, title, meta, tail, children }) {
  return (
    <div className="item">
      {icon && (
        <span className="ico" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="item-body">
        <div className="between">
          <span className="item-title">{title}</span>
          {tail}
        </div>
        {meta && <div className="item-meta">{meta}</div>}
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ empty state */
export function Empty({ icon = "📭", children }) {
  return (
    <div className="empty">
      <span className="ico" aria-hidden="true">
        {icon}
      </span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ toast */
export function Toast({ message }) {
  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}
