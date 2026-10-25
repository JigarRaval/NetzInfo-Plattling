/**
 * kit.jsx - the reusable interface building blocks.
 *
 * One rule runs through this file: a component ALWAYS merges an incoming
 * className onto its own classes with cx(). Spreading props after className
 * would silently delete the base class and leave an unstyled element.
 */

import React from "react";
import { IconLookup } from "./Icons.jsx";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

/* Helper to render icon from name or SVG component */
export function renderIcon(icon, size = 20) {
  if (!icon) return null;

  // If icon is a string, look it up in IconLookup
  if (typeof icon === "string") {
    const IconComponent = IconLookup[icon];
    if (IconComponent) {
      return <IconComponent size={size} />;
    }
    // If not found in IconLookup, return empty (remove emojis)
    return null;
  }

  // If icon is already a React component, render it
  if (React.isValidElement(icon)) {
    return icon;
  }

  return null;
}

/* Helper to clean emojis from labels */
export function cleanLabel(label) {
  if (!label) return label;
  // Remove emoji characters
  return label.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
}

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
      {icon && <span className="ico" aria-hidden="true">{renderIcon(icon, 19)}</span>}
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
          {icon && <span className="ico" aria-hidden="true">{renderIcon(icon, 20)}</span>}
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
        {renderIcon(icon, 34)}
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
          {cleanLabel(label)}
        </label>
      )}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------- list row */
export function Item({ icon, title, meta, tail, children, onClick }) {
  return (
    <div className="item" onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      {icon && <span className="ico" aria-hidden="true">{renderIcon(icon, 23)}</span>}
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
export function Empty({ icon = "emptyMailbox", children }) {
  return (
    <div className="empty">
      <span className="ico" aria-hidden="true">
        {renderIcon(icon, 48)}
      </span>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------- loading state */
export function Loading({ message }) {
  return (
    <div className="loading-state">
      <div className="loading-spinner" aria-hidden="true" />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

/* ------------------------------------------------------------ error state */
export function ErrorState({ title, message, onRetry }) {
  return (
    <div className="error-state">
      <span className="ico" aria-hidden="true">
        {renderIcon("warning", 48)}
      </span>
      <h3 className="error-title">{title}</h3>
      {message && <p className="error-message">{message}</p>}
      {onRetry && (
        <button className="btn-retry" onClick={onRetry}>
          {onRetry}
        </button>
      )}
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
