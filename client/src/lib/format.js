/**
 * format.js - turns server data into text in the user's language.
 *
 * The server sends ids, translation keys and numbers; every one of them is
 * converted here. Nothing reaches the screen without passing through this
 * file or the dictionary in i18n/strings.js.
 */

/** Clock time for display, e.g. "14:35". */
export function clockTime(iso, lang) {
  return new Date(iso).toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative time, e.g. "12 min ago". */
export function relativeTime(iso, t) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return t("c_just_now");
  if (minutes < 60) return t("c_min_ago", { n: minutes });
  return t("c_hour_ago", { n: Math.round(minutes / 60) });
}

export function serviceName(catalog, serviceId, lang) {
  const service = catalog.services[serviceId];
  return service ? service.name[lang] || service.name.de : serviceId;
}

export function serviceIcon(catalog, serviceId) {
  return catalog.services[serviceId]?.icon || "📄";
}

export function presetName(catalog, presetId, lang) {
  const preset = catalog.presets.find((p) => p.id === presetId);
  return preset ? preset.name[lang] || preset.name.de : "";
}

export function districtNames(catalog, ids = []) {
  return ids
    .map((id) => catalog.districts.find((d) => d.id === id)?.name)
    .filter(Boolean)
    .join(", ");
}

export function channelName(t, id) {
  return t(`ch_${id}`);
}

export function channelMessage(t, result) {
  return t(result.messageKey, result.params || {});
}

/** Icon for one channel row in the result list. */
export function channelIcon(result) {
  if (result.skipped) return "⏭️";
  return result.ok ? "✅" : "❌";
}

/**
 * Problems that must be fixed before sending - a missing district or a
 * missing time. Style remarks are deliberately not included: a slightly long
 * sentence must never stand between a burst pipe and the people affected.
 * When everything is in order the user sees nothing at all.
 */
export function blockingProblems(t, checks = []) {
  return checks
    .filter((c) => c.blocking && !c.ok)
    .map((check) => {
      if (check.id === "structure") return t("chk_structure", check.params);
      if (check.id === "readability") return t("chk_readability", check.params);
      const list = (check.problems || [])
        .map((p) => t(p.key, p.params))
        .join(", ");
      return t("chk_facts", { list });
    });
}
