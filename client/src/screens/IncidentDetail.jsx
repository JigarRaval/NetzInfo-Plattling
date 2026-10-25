/**
 * IncidentDetail.jsx - complete incident information.
 */

import React from "react";
import { Button, Card, renderIcon } from "../ui/kit.jsx";
import {
  clockTime,
  districtNames,
  presetName,
  serviceIcon,
  serviceName,
} from "../lib/format.js";

export default function IncidentDetail({ t, lang, catalog, incidents, go }) {
  // Get incident ID from URL hash: #/incident/:id
  const incidentId = window.location.hash.replace(/^#\/incident\//, "");
  const incident = incidents.find((i) => i.id === incidentId);

  if (!incident) {
    return (
      <div className="stack">
        <Card icon="alert" title="Error">
          <p className="muted">Incident not found. It may have been deleted.</p>
          <Button variant="ghost" onClick={() => go("home")}>
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const isResolved = incident.status === "resolved";
  const isRunning = !isResolved && incident.publishedAt;
  const isDraft = !isResolved && !incident.publishedAt;

  return (
    <div className="stack">
      {/* Header with back button */}
      <div className="row">
        <Button variant="ghost" icon="arrowLeft" onClick={() => go("home")}>
          Back to Overview
        </Button>
      </div>

      {/* Status card */}
      <Card
        icon={isResolved ? "check" : isRunning ? "alert" : "clock"}
        title={
          isResolved
            ? "Status: Resolved"
            : isRunning
            ? "Status: Running"
            : "Status: Draft"
        }
      >
        <div className="row" style={{ alignItems: "center", gap: 12 }}>
          <span className="ico" aria-hidden="true">
            {renderIcon(serviceIcon(catalog, incident.service), 32)}
          </span>
          <div>
            <div className="item-title">
              {serviceName(catalog, incident.service, lang)}
            </div>
            <div className="item-meta">
              {presetName(catalog, incident.presetId, lang)}
            </div>
          </div>
        </div>
      </Card>

      {/* Location information */}
      <Card icon="mapPin" title="Location Details">
        <div className="stack-sm">
          <div>
            <strong>Districts:</strong>{" "}
            {districtNames(catalog, incident.districts)}
          </div>
          {incident.street && (
            <div>
              <strong>Street:</strong> {incident.street}
            </div>
          )}
          {incident.coords && (
            <div>
              <strong>Coordinates:</strong> {incident.coords.lat.toFixed(6)},{" "}
              {incident.coords.lng.toFixed(6)}
            </div>
          )}
          {incident.radiusMeters && (
            <div>
              <strong>Radius:</strong> {incident.radiusMeters}m
            </div>
          )}
        </div>
      </Card>

      {/* Timing information */}
      <Card icon="clock" title="Timing & Metadata">
        <div className="stack-sm">
          <div>
            <strong>Started:</strong> {clockTime(incident.startedAt, lang)}
          </div>
          <div>
            <strong>Captured:</strong> {clockTime(incident.capturedAt, lang)}
          </div>
          {incident.etaAt && (
            <div>
              <strong>Estimated Resolution:</strong>{" "}
              {clockTime(incident.etaAt, lang)}
            </div>
          )}
          {incident.resolvedAt && (
            <div>
              <strong>Resolved:</strong> {clockTime(incident.resolvedAt, lang)}
            </div>
          )}
          {incident.publishedAt && (
            <div>
              <strong>Published:</strong>{" "}
              {clockTime(incident.publishedAt, lang)}
            </div>
          )}

          <div className="divider" />

          <div>
            <strong>Incident ID:</strong>{" "}
            <span className="mono">{incident.id}</span>
          </div>
          {incident.reportedBy?.name && (
            <div>
              <strong>Reported By:</strong> {incident.reportedBy.name}
            </div>
          )}
          {incident.note && (
            <div>
              <strong>Internal Note:</strong> {incident.note}
            </div>
          )}

          <div className="row" style={{ marginTop: 8 }}>
            <span
              className={`badge ${
                incident.critical ? "badge--danger" : "badge--ok"
              }`}
            >
              {incident.critical ? "Critical" : "Non-Critical"}
            </span>
            <span
              className={`badge ${
                incident.planned ? "badge--warn" : "badge--ok"
              }`}
            >
              {incident.planned ? "Planned" : "Unplanned"}
            </span>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="row" style={{ gap: 12, marginTop: 8 }}>
        <Button variant="primary" onClick={() => go("home")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
