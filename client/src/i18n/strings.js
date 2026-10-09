/**
 * strings.js - every piece of interface text, in all four languages.
 *
 * One entry per key with the languages side by side, so a missing
 * translation is visible while editing and `npm run check` fails the build
 * if any language is empty. Placeholders use {name}.
 */

export const STRINGS = {
  /* ------------------------------------------------------------ branding */
  app_name: {
    de: "Stadtwerke Plattling",
    en: "Stadtwerke Plattling",
    fr: "Stadtwerke Plattling",
    es: "Stadtwerke Plattling",
  },
  app_tagline: {
    de: "Störungsmeldungen der Stadtwerke",
    en: "Outage notices of the city utilities",
    fr: "Avis de pannes des services municipaux",
    es: "Avisos de incidencias de los servicios municipales",
  },

  /* ---------------------------------------------------------- navigation */
  nav_home: { de: "Start", en: "Home", fr: "Accueil", es: "Inicio" },
  nav_report: { de: "Melden", en: "Report", fr: "Signaler", es: "Notificar" },
  nav_send: { de: "Senden", en: "Send", fr: "Envoyer", es: "Enviar" },
  nav_manual: { de: "Hilfe", en: "Help", fr: "Aide", es: "Ayuda" },

  /* -------------------------------------------------------------- common */
  c_loading: {
    de: "Wird geladen …",
    en: "Loading …",
    fr: "Chargement …",
    es: "Cargando …",
  },
  c_error: { de: "Fehler", en: "Error", fr: "Erreur", es: "Error" },
  c_offline: {
    de: "Server nicht erreichbar",
    en: "Server unreachable",
    fr: "Serveur injoignable",
    es: "Servidor no disponible",
  },
  c_save: { de: "Speichern", en: "Save", fr: "Enregistrer", es: "Guardar" },
  c_cancel: { de: "Abbrechen", en: "Cancel", fr: "Annuler", es: "Cancelar" },
  c_refresh: {
    de: "Aktualisieren",
    en: "Refresh",
    fr: "Actualiser",
    es: "Actualizar",
  },
  c_refreshed: {
    de: "Aktualisiert",
    en: "Refreshed",
    fr: "Actualisé",
    es: "Actualizado",
  },
  c_language: { de: "Sprache", en: "Language", fr: "Langue", es: "Idioma" },
  c_dark: {
    de: "Nachtmodus",
    en: "Night mode",
    fr: "Mode nuit",
    es: "Modo noche",
  },
  c_light: { de: "Tagmodus", en: "Day mode", fr: "Mode jour", es: "Modo día" },
  c_minutes: { de: "Minuten", en: "minutes", fr: "minutes", es: "minutos" },
  c_households: {
    de: "Haushalte",
    en: "households",
    fr: "foyers",
    es: "hogares",
  },
  c_show_more: {
    de: "Mehr anzeigen",
    en: "Show more",
    fr: "Afficher plus",
    es: "Mostrar más",
  },
  c_show_less: {
    de: "Weniger anzeigen",
    en: "Show less",
    fr: "Afficher moins",
    es: "Mostrar menos",
  },
  c_just_now: {
    de: "gerade eben",
    en: "just now",
    fr: "à l’instant",
    es: "ahora mismo",
  },
  c_min_ago: {
    de: "vor {n} Min.",
    en: "{n} min ago",
    fr: "il y a {n} min",
    es: "hace {n} min",
  },
  c_hour_ago: {
    de: "vor {n} Std.",
    en: "{n} h ago",
    fr: "il y a {n} h",
    es: "hace {n} h",
  },

  /* -------------------------------------------------------------- status */
  st_resolved: { de: "Behoben", en: "Resolved", fr: "Résolue", es: "Resuelta" },
  st_published: { de: "Gesendet", en: "Sent", fr: "Envoyé", es: "Enviado" },
  st_unpublished: {
    de: "Noch nicht gesendet",
    en: "Not sent yet",
    fr: "Pas encore envoyé",
    es: "Aún sin enviar",
  },

  /* --------------------------------------------------------------- kinds */
  kind_first: {
    de: "Erstmeldung",
    en: "First notice",
    fr: "Premier message",
    es: "Primer aviso",
  },
  kind_update: {
    de: "Update",
    en: "Update",
    fr: "Mise à jour",
    es: "Actualización",
  },
  kind_allclear: {
    de: "Entwarnung",
    en: "All clear",
    fr: "Fin d’alerte",
    es: "Fin de aviso",
  },

  /* ----------------------------------------------------------------- home */
  hm_ok_title: {
    de: "Alles in Ordnung",
    en: "Everything is fine",
    fr: "Tout va bien",
    es: "Todo en orden",
  },
  hm_ok_text: {
    de: "Zurzeit sind keine Störungen gemeldet.",
    en: "No outages are reported at the moment.",
    fr: "Aucune panne signalée pour le moment.",
    es: "No hay incidencias notificadas.",
  },
  hm_alert_title: {
    de: "{n} Störung(en) laufen",
    en: "{n} outage(s) running",
    fr: "{n} panne(s) en cours",
    es: "{n} incidencia(s) en curso",
  },
  hm_alert_text: {
    de: "Bitte Entwarnung senden, sobald behoben.",
    en: "Send the all-clear as soon as it is fixed.",
    fr: "Envoyez la fin d’alerte dès que c’est réparé.",
    es: "Envíe el fin de aviso en cuanto se resuelva.",
  },
  hm_report_btn: {
    de: "Störung melden",
    en: "Report an outage",
    fr: "Signaler une panne",
    es: "Notificar una incidencia",
  },
  hm_waiting: {
    de: "{n} Meldung(en) warten auf das Senden",
    en: "{n} message(s) waiting to be sent",
    fr: "{n} message(s) en attente d’envoi",
    es: "{n} mensaje(s) pendientes de envío",
  },
  hm_waiting_btn: {
    de: "Jetzt ansehen",
    en: "Look at them now",
    fr: "Voir maintenant",
    es: "Ver ahora",
  },
  hm_running: {
    de: "Laufende Störungen",
    en: "Running outages",
    fr: "Pannes en cours",
    es: "Incidencias en curso",
  },
  hm_running_none: {
    de: "Keine laufenden Störungen.",
    en: "No running outages.",
    fr: "Aucune panne en cours.",
    es: "No hay incidencias en curso.",
  },
  hm_close_btn: {
    de: "Behoben – Entwarnung senden",
    en: "Fixed – send the all-clear",
    fr: "Réparé – envoyer la fin d’alerte",
    es: "Resuelto: enviar fin de aviso",
  },
  hm_close_busy: {
    de: "Wird gesendet …",
    en: "Sending …",
    fr: "Envoi …",
    es: "Enviando …",
  },
  hm_close_done: {
    de: "Entwarnung gesendet",
    en: "All-clear sent",
    fr: "Fin d’alerte envoyée",
    es: "Fin de aviso enviado",
  },
  hm_update_btn: {
    de: "Dauert länger",
    en: "Taking longer",
    fr: "Cela dure plus longtemps",
    es: "Tarda más",
  },
  hm_update_made: {
    de: "Update vorbereitet",
    en: "Update prepared",
    fr: "Mise à jour préparée",
    es: "Actualización preparada",
  },
  hm_history: {
    de: "Zuletzt behoben",
    en: "Recently resolved",
    fr: "Récemment résolues",
    es: "Resueltas recientemente",
  },
  hm_since: {
    de: "seit {time}",
    en: "since {time}",
    fr: "depuis {time}",
    es: "desde {time}",
  },
  hm_until: {
    de: "bis {time}",
    en: "until {time}",
    fr: "jusqu’à {time}",
    es: "hasta {time}",
  },

  /* --------------------------------------------------------------- report */
  rp_title: {
    de: "Störung melden",
    en: "Report an outage",
    fr: "Signaler une panne",
    es: "Notificar una incidencia",
  },
  rp_sub: {
    de: "Zwei Schritte: Was und Wo.",
    en: "Two steps: what and where.",
    fr: "Deux étapes : quoi et où.",
    es: "Dos pasos: qué y dónde.",
  },
  rp_s1_title: {
    de: "Was ist passiert?",
    en: "What happened?",
    fr: "Que s’est-il passé ?",
    es: "¿Qué ha pasado?",
  },
  rp_s1_hint: {
    de: "Eine Vorlage antippen",
    en: "Tap one option",
    fr: "Touchez une option",
    es: "Toque una opción",
  },
  rp_s2_title: { de: "Wo?", en: "Where?", fr: "Où ?", es: "¿Dónde?" },
  rp_s2_hint: {
    de: "Einen oder mehrere Ortsteile wählen",
    en: "Choose one or more districts",
    fr: "Choisissez un ou plusieurs quartiers",
    es: "Elija una o varias zonas",
  },
  rp_s3_title: {
    de: "Mehr Angaben",
    en: "More details",
    fr: "Plus de détails",
    es: "Más detalles",
  },
  rp_s3_hint: {
    de: "Kann übersprungen werden",
    en: "Can be skipped",
    fr: "Peut être ignoré",
    es: "Se puede omitir",
  },
  rp_duration: {
    de: "Dauert voraussichtlich",
    en: "Expected to last",
    fr: "Durée prévue",
    es: "Duración prevista",
  },
  rp_street: { de: "Straße", en: "Street", fr: "Rue", es: "Calle" },
  rp_street_ph: {
    de: "z. B. Bahnhofstraße 12",
    en: "e.g. Bahnhofstraße 12",
    fr: "p. ex. Bahnhofstraße 12",
    es: "p. ej. Bahnhofstraße 12",
  },
  rp_radius: {
    de: "Betroffener Radius",
    en: "Affected radius",
    fr: "Rayon affecté",
    es: "Radio afectado",
  },
  rp_note: { de: "Notiz", en: "Note", fr: "Note", es: "Nota" },
  rp_note_ph: {
    de: "Freitext",
    en: "Free text",
    fr: "Texte libre",
    es: "Texto libre",
  },
  rp_dictate: { de: "Sprechen", en: "Speak", fr: "Dicter", es: "Hablar" },
  rp_dictate_stop: { de: "Stopp", en: "Stop", fr: "Arrêter", es: "Detener" },
  rp_dictate_hint: {
    de: "Die Spracherkennung läuft im Gerät.",
    en: "Speech recognition runs on the device.",
    fr: "La reconnaissance vocale reste sur l’appareil.",
    es: "El reconocimiento de voz se queda en el dispositivo.",
  },
  rp_dictate_no: {
    de: "Dieser Browser kann das nicht.",
    en: "This browser cannot do that.",
    fr: "Ce navigateur ne le permet pas.",
    es: "Este navegador no puede hacerlo.",
  },
  rp_location: {
    de: "Standort verwenden",
    en: "Use my location",
    fr: "Utiliser ma position",
    es: "Usar mi ubicación",
  },
  rp_location_ok: {
    de: "Standort übernommen",
    en: "Location saved",
    fr: "Position enregistrée",
    es: "Ubicación guardada",
  },
  rp_location_no: {
    de: "Standort nicht verfügbar",
    en: "Location not available",
    fr: "Position indisponible",
    es: "Ubicación no disponible",
  },
  rp_submit: {
    de: "Weiter zum Text",
    en: "Continue to the text",
    fr: "Continuer vers le texte",
    es: "Continuar al texto",
  },
  rp_submitting: {
    de: "Einen Moment …",
    en: "One moment …",
    fr: "Un instant …",
    es: "Un momento …",
  },
  rp_need_preset: {
    de: "Bitte zuerst oben etwas auswählen.",
    en: "Please choose something above first.",
    fr: "Choisissez d’abord une option ci-dessus.",
    es: "Elija primero una opción arriba.",
  },
  rp_need_district: {
    de: "Bitte mindestens einen Ortsteil wählen.",
    en: "Please choose at least one district.",
    fr: "Choisissez au moins un quartier.",
    es: "Elija al menos una zona.",
  },
  rp_dup_title: {
    de: "Gibt es schon",
    en: "Already reported",
    fr: "Déjà signalé",
    es: "Ya notificado",
  },
  rp_dup_text: {
    de: "Für diese Sparte und diesen Ortsteil läuft bereits eine Meldung. Solange die Arbeiten laufen, kann sie nicht doppelt gemeldet werden – schreiben Sie stattdessen ein Update.",
    en: "A report for this utility and district is already running. While the work is in progress it cannot be reported twice - write an update instead.",
    fr: "Un signalement est déjà en cours pour ce réseau et ce quartier. Tant que les travaux durent, écrivez plutôt une mise à jour.",
    es: "Ya hay un aviso en curso para este servicio y esta zona. Mientras duren los trabajos, escriba una actualización.",
  },
  rp_dup_update: {
    de: "Update dazu schreiben",
    en: "Write an update instead",
    fr: "Écrire une mise à jour",
    es: "Escribir una actualización",
  },

  /* ----------------------------------------------------------------- send */
  sd_title: {
    de: "Text prüfen und senden",
    en: "Check the text and send",
    fr: "Vérifier le texte et envoyer",
    es: "Revisar el texto y enviar",
  },
  sd_sub: {
    de: "Nichts geht raus, bevor Sie auf Senden tippen.",
    en: "Nothing goes out before you press send.",
    fr: "Rien ne part avant que vous appuyiez sur envoyer.",
    es: "Nada se envía hasta que pulse enviar.",
  },
  sd_empty: {
    de: "Nichts zu senden. Alles erledigt.",
    en: "Nothing to send. All done.",
    fr: "Rien à envoyer. Tout est fait.",
    es: "Nada que enviar. Todo listo.",
  },
  sd_lang: {
    de: "Sprache der Vorschau",
    en: "Preview language",
    fr: "Langue de l’aperçu",
    es: "Idioma de la vista previa",
  },
  sd_edit: {
    de: "Text ändern",
    en: "Change the text",
    fr: "Modifier le texte",
    es: "Cambiar el texto",
  },
  sd_saved: {
    de: "Änderung gespeichert",
    en: "Change saved",
    fr: "Modification enregistrée",
    es: "Cambio guardado",
  },
  sd_edited: {
    de: "Dieser Text wurde von Hand geändert.",
    en: "This text was changed by hand.",
    fr: "Ce texte a été modifié à la main.",
    es: "Este texto se cambió a mano.",
  },
  sd_publish: {
    de: "Jetzt senden",
    en: "Send now",
    fr: "Envoyer maintenant",
    es: "Enviar ahora",
  },
  sd_publishing: {
    de: "Wird gesendet …",
    en: "Sending …",
    fr: "Envoi …",
    es: "Enviando …",
  },
  sd_done_title: { de: "Gesendet", en: "Sent", fr: "Envoyé", es: "Enviado" },
  sd_done_text: {
    de: "Die Meldung ist auf allen Kanälen erschienen.",
    en: "The notice has appeared on every channel.",
    fr: "Le message est paru sur tous les canaux.",
    es: "El aviso ha aparecido en todos los canales.",
  },
  sd_reached: {
    de: "{ok} von {total} Kanälen",
    en: "{ok} of {total} channels",
    fr: "{ok} canaux sur {total}",
    es: "{ok} de {total} canales",
  },
  sd_problem: {
    de: "Der Text hat noch ein Problem",
    en: "The text still has a problem",
    fr: "Le texte pose encore un problème",
    es: "El texto todavía tiene un problema",
  },

  /* ------------------------------------------- warnings (only on failure) */
  chk_structure: {
    de: "Es fehlt ein Teil der Meldung: {missing}",
    en: "Part of the notice is missing: {missing}",
    fr: "Une partie du message manque : {missing}",
    es: "Falta una parte del aviso: {missing}",
  },
  chk_readability: {
    de: "Der Text ist schwer zu lesen ({avg} Wörter pro Satz).",
    en: "The text is hard to read ({avg} words per sentence).",
    fr: "Le texte est difficile à lire ({avg} mots par phrase).",
    es: "El texto es difícil de leer ({avg} palabras por frase).",
  },
  chk_facts: {
    de: "Angaben fehlen im Text: {list}",
    en: "Details are missing from the text: {list}",
    fr: "Des informations manquent : {list}",
    es: "Faltan datos en el texto: {list}",
  },
  fact_district_missing: {
    de: "Ortsteil {name}",
    en: "district {name}",
    fr: "quartier {name}",
    es: "zona {name}",
  },
  fact_start_missing: {
    de: "Startzeit",
    en: "start time",
    fr: "heure de début",
    es: "hora de inicio",
  },
  fact_eta_missing: {
    de: "Endzeit",
    en: "end time",
    fr: "heure de fin",
    es: "hora de fin",
  },
  fact_boil_missing: {
    de: "Abkochgebot",
    en: "boil-water notice",
    fr: "consigne d’ébullition",
    es: "aviso de hervir el agua",
  },

  /* ------------------------------------------------------------- channels */
  ch_statuspage: {
    de: "Status-Seite",
    en: "Status page",
    fr: "Page d’état",
    es: "Página de estado",
  },
  ch_rss: { de: "RSS-Feed", en: "RSS feed", fr: "Flux RSS", es: "Canal RSS" },
  ch_widget: {
    de: "Stadt-Widget",
    en: "City widget",
    fr: "Widget municipal",
    es: "Widget municipal",
  },
  ch_push: {
    de: "App-Push",
    en: "App push",
    fr: "Notification push",
    es: "Notificación push",
  },
  ch_heimatinfo: {
    de: "Heimat-Info",
    en: "Heimat-Info",
    fr: "Heimat-Info",
    es: "Heimat-Info",
  },
  ch_webhook: {
    de: "REST-Webhook",
    en: "REST webhook",
    fr: "Webhook REST",
    es: "Webhook REST",
  },
  ch_press: { de: "Presse", en: "Press", fr: "Presse", es: "Prensa" },

  ch_msg_updated: {
    de: "Aktualisiert",
    en: "Updated",
    fr: "Mis à jour",
    es: "Actualizado",
  },
  ch_msg_regenerated: {
    de: "Neu erzeugt",
    en: "Regenerated",
    fr: "Régénéré",
    es: "Regenerado",
  },
  ch_msg_webhook_local: {
    de: "Kein Ziel hinterlegt – lokal abgelegt",
    en: "No target set – stored locally",
    fr: "Aucune cible – stocké localement",
    es: "Sin destino: guardado localmente",
  },
  ch_msg_webhook_sent: {
    de: "Gesendet (HTTP {status})",
    en: "Sent (HTTP {status})",
    fr: "Envoyé (HTTP {status})",
    es: "Enviado (HTTP {status})",
  },
  ch_msg_webhook_failed: {
    de: "Fehlgeschlagen: {detail}",
    en: "Failed: {detail}",
    fr: "Échec : {detail}",
    es: "Error: {detail}",
  },
  ch_msg_press_sent: {
    de: "Pressetext übergeben",
    en: "Press text handed over",
    fr: "Texte de presse transmis",
    es: "Texto de prensa entregado",
  },
  ch_msg_hi_created: {
    de: "Beitrag angelegt ({status})",
    en: "Post created ({status})",
    fr: "Publication créée ({status})",
    es: "Publicación creada ({status})",
  },
  ch_msg_hi_not_configured: {
    de: "Keine Zugangsdaten – übersprungen",
    en: "No credentials – skipped",
    fr: "Pas d’identifiants – ignoré",
    es: "Sin credenciales: omitido",
  },
  ch_msg_hi_failed: {
    de: "Nicht angelegt: {detail}",
    en: "Not created: {detail}",
    fr: "Non créé : {detail}",
    es: "No creado: {detail}",
  },
  ch_msg_error: {
    de: "Fehler: {detail}",
    en: "Error: {detail}",
    fr: "Erreur : {detail}",
    es: "Error: {detail}",
  },

  /* ---------------------------------------------------------------- login */
  lg_sub: {
    de: "Namen wählen und eigene PIN eingeben",
    en: "Choose your name and enter your own PIN",
    fr: "Choisissez votre nom et saisissez votre code",
    es: "Elija su nombre e introduzca su PIN",
  },
  lg_enter: { de: "PIN", en: "PIN", fr: "Code", es: "PIN" },
  lg_wrong: {
    de: "Name oder PIN stimmt nicht.",
    en: "Name or PIN is not correct.",
    fr: "Nom ou code incorrect.",
    es: "Nombre o PIN incorrecto.",
  },
  lg_button: {
    de: "Anmelden",
    en: "Sign in",
    fr: "Se connecter",
    es: "Entrar",
  },
  lg_out: { de: "Abmelden", en: "Sign out", fr: "Se déconnecter", es: "Salir" },

  /* --------------------------------------------------- push notifications */
  ps_enable: {
    de: "Benachrichtigungen einschalten",
    en: "Turn on notifications",
    fr: "Activer les notifications",
    es: "Activar notificaciones",
  },
  ps_on: {
    de: "Benachrichtigungen sind an",
    en: "Notifications are on",
    fr: "Notifications activées",
    es: "Notificaciones activadas",
  },
  ps_denied: {
    de: "Benachrichtigungen wurden abgelehnt",
    en: "Notifications were declined",
    fr: "Notifications refusées",
    es: "Notificaciones rechazadas",
  },
  ps_unsupported: {
    de: "Dieser Browser kann keine Benachrichtigungen",
    en: "This browser cannot show notifications",
    fr: "Ce navigateur ne gère pas les notifications",
    es: "Este navegador no admite notificaciones",
  },
  ps_recent: {
    de: "Letzte Benachrichtigungen",
    en: "Recent notifications",
    fr: "Notifications récentes",
    es: "Notificaciones recientes",
  },
  ps_no_notifications: {
    de: "Keine neuen Benachrichtigungen",
    en: "No new notifications",
    fr: "Aucune nouvelle notification",
    es: "Sin notificaciones nuevas",
  },

  /* ------------------------------------------------------- exact location */
  rp_locating: {
    de: "Standort wird bestimmt …",
    en: "Finding the location …",
    fr: "Localisation …",
    es: "Buscando la ubicación …",
  },
  rp_location_clear: {
    de: "Entfernen",
    en: "Remove",
    fr: "Retirer",
    es: "Quitar",
  },
  rp_location_acc: {
    de: "Genauigkeit etwa {m} Meter",
    en: "Accurate to about {m} metres",
    fr: "Précision d’environ {m} mètres",
    es: "Precisión de unos {m} metros",
  },

  /* ----------------------------------------------------------- editing --- */
  sd_edit_hint: {
    de: "Sie können den Text auch direkt antippen.",
    en: "You can also tap the text directly.",
    fr: "Vous pouvez aussi toucher le texte.",
    es: "También puede tocar el texto.",
  },

  /* --------------------------------------------------- push channel result */
  ch_msg_push_sent: {
    de: "An {delivered} von {total} Geräten gesendet",
    en: "Sent to {delivered} of {total} devices",
    fr: "Envoyé à {delivered} appareils sur {total}",
    es: "Enviado a {delivered} de {total} dispositivos",
  },
  ch_msg_push_nobody: {
    de: "Noch niemand hat Benachrichtigungen aktiviert",
    en: "Nobody has turned on notifications yet",
    fr: "Personne n’a encore activé les notifications",
    es: "Nadie ha activado las notificaciones todavía",
  },
  ch_msg_push_stored: {
    de: "Für den Versand vorbereitet",
    en: "Prepared for delivery",
    fr: "Préparé pour l’envoi",
    es: "Preparado para el envío",
  },

  /* ----------------------------------------------- editing the master data */
  cat_add_problem: {
    de: "Problem hinzufügen",
    en: "Add a problem type",
    fr: "Ajouter un type",
    es: "Añadir un tipo",
  },
  cat_add_district: {
    de: "Ort hinzufügen",
    en: "Add a place",
    fr: "Ajouter un lieu",
    es: "Añadir un lugar",
  },
  cat_name: { de: "Bezeichnung", en: "Name", fr: "Nom", es: "Nombre" },
  cat_name_problem: {
    de: "z. B. Gasgeruch",
    en: "e.g. Gas smell",
    fr: "p. ex. Odeur de gaz",
    es: "p. ej. Olor a gas",
  },
  cat_name_place: {
    de: "z. B. Neustadt",
    en: "e.g. Neustadt",
    fr: "p. ex. Neustadt",
    es: "p. ej. Neustadt",
  },
  cat_households: {
    de: "Haushalte (ungefähr)",
    en: "Households (roughly)",
    fr: "Foyers (environ)",
    es: "Hogares (aprox.)",
  },
  cat_service: { de: "Sparte", en: "Utility", fr: "Réseau", es: "Servicio" },
  cat_tone: {
    de: "Tonfall der Meldung",
    en: "Tone of the message",
    fr: "Ton du message",
    es: "Tono del mensaje",
  },
  cat_duration: {
    de: "Übliche Dauer (Minuten)",
    en: "Usual duration (minutes)",
    fr: "Durée habituelle (minutes)",
    es: "Duración habitual (minutos)",
  },
  cat_save: { de: "Hinzufügen", en: "Add", fr: "Ajouter", es: "Añadir" },
  cat_added: { de: "Hinzugefügt", en: "Added", fr: "Ajouté", es: "Añadido" },
  cat_removed: {
    de: "Entfernt",
    en: "Removed",
    fr: "Supprimé",
    es: "Eliminado",
  },
  cat_remove: {
    de: "Entfernen",
    en: "Remove",
    fr: "Supprimer",
    es: "Eliminar",
  },
  cat_need_name: {
    de: "Bitte eine Bezeichnung eingeben.",
    en: "Please enter a name.",
    fr: "Veuillez saisir un nom.",
    es: "Introduzca un nombre.",
  },

  tone_reassuring: {
    de: "Beruhigend – geplante Arbeiten",
    en: "Reassuring - planned work",
    fr: "Rassurant - travaux planifiés",
    es: "Tranquilizador: trabajo planificado",
  },
  tone_steady: {
    de: "Sachlich – normale Störung",
    en: "Steady - a normal outage",
    fr: "Neutre - panne normale",
    es: "Neutro: incidencia normal",
  },
  tone_careful: {
    de: "Ernst – Gesundheit betroffen",
    en: "Careful - health relevant",
    fr: "Sérieux - santé concernée",
    es: "Serio: afecta a la salud",
  },
  tone_light: {
    de: "Leicht – kleine Einschränkung",
    en: "Light - a small inconvenience",
    fr: "Léger - gêne mineure",
    es: "Leve: molestia pequeña",
  },

  /* ------------------------------- microphone and location, failure cases */
  rp_insecure: {
    de: "Mikrofon und Standort brauchen eine sichere Verbindung (https oder localhost).",
    en: "Microphone and location need a secure connection (https or localhost).",
    fr: "Le micro et la position nécessitent une connexion sécurisée (https ou localhost).",
    es: "El micrófono y la ubicación requieren una conexión segura (https o localhost).",
  },
  rp_listening: {
    de: "Ich höre zu …",
    en: "Listening …",
    fr: "J’écoute …",
    es: "Escuchando …",
  },
  rp_dictate_err: {
    de: "Aufnahme nicht möglich.",
    en: "Recording is not possible.",
    fr: "Enregistrement impossible.",
    es: "No se puede grabar.",
  },
  rp_mic_denied: {
    de: "Zugriff auf das Mikrofon wurde abgelehnt.",
    en: "Microphone access was denied.",
    fr: "L’accès au micro a été refusé.",
    es: "Se denegó el acceso al micrófono.",
  },
  rp_mic_nomic: {
    de: "Kein Mikrofon gefunden.",
    en: "No microphone found.",
    fr: "Aucun micro détecté.",
    es: "No se ha encontrado micrófono.",
  },
  rp_mic_nospeech: {
    de: "Nichts gehört. Bitte noch einmal sprechen.",
    en: "Nothing heard. Please speak again.",
    fr: "Rien entendu. Parlez à nouveau.",
    es: "No se oyó nada. Hable de nuevo.",
  },
  rp_mic_network: {
    de: "Spracherkennung offline nicht verfügbar.",
    en: "Speech recognition is not available offline.",
    fr: "Reconnaissance vocale indisponible hors ligne.",
    es: "El reconocimiento de voz no funciona sin conexión.",
  },
  rp_loc_denied: {
    de: "Zugriff auf den Standort wurde abgelehnt.",
    en: "Location access was denied.",
    fr: "L’accès à la position a été refusé.",
    es: "Se denegó el acceso a la ubicación.",
  },
  rp_loc_unavailable: {
    de: "Kein Standortsignal. Draußen noch einmal versuchen.",
    en: "No location signal. Try again outdoors.",
    fr: "Aucun signal. Réessayez dehors.",
    es: "Sin señal. Inténtelo al aire libre.",
  },
  rp_loc_timeout: {
    de: "Standortsuche hat zu lange gedauert.",
    en: "Finding the location took too long.",
    fr: "La localisation a pris trop de temps.",
    es: "La localización tardó demasiado.",
  },
  rp_loc_improving: {
    de: "wird genauer …",
    en: "improving …",
    fr: "affinage …",
    es: "mejorando …",
  },

  /* --------------------------------------- deleting and rewriting a draft */
  sd_delete: {
    de: "Diese Meldung löschen",
    en: "Delete this report",
    fr: "Supprimer ce signalement",
    es: "Eliminar este aviso",
  },
  sd_delete_sure: {
    de: "Wirklich löschen?",
    en: "Really delete it?",
    fr: "Vraiment supprimer ?",
    es: "¿Eliminar de verdad?",
  },
  sd_delete_yes: {
    de: "Ja, löschen",
    en: "Yes, delete",
    fr: "Oui, supprimer",
    es: "Sí, eliminar",
  },
  sd_deleted: {
    de: "Meldung gelöscht",
    en: "Report deleted",
    fr: "Signalement supprimé",
    es: "Aviso eliminado",
  },
  sd_regenerate: {
    de: "Andere Formulierung",
    en: "Different wording",
    fr: "Autre formulation",
    es: "Otra redacción",
  },
  sd_regenerated: {
    de: "Text neu formuliert",
    en: "Text rewritten",
    fr: "Texte reformulé",
    es: "Texto reescrito",
  },
  sd_tone: {
    de: "Tonfall ändern",
    en: "Change the tone",
    fr: "Changer le ton",
    es: "Cambiar el tono",
  },

  /* -------------------------------------------- who is on shift, and where */
  lg_who: {
    de: "Wer meldet?",
    en: "Who is reporting?",
    fr: "Qui signale ?",
    es: "¿Quién informa?",
  },
  hm_reported_by: {
    de: "gemeldet von {name}",
    en: "reported by {name}",
    fr: "signalé par {name}",
    es: "notificado por {name}",
  },
  rp_map: {
    de: "Karte des gemeldeten Standorts",
    en: "Map of the reported position",
    fr: "Carte de la position signalée",
    es: "Mapa de la posición indicada",
  },
  rp_map_open: {
    de: "Größere Karte öffnen",
    en: "Open a larger map",
    fr: "Ouvrir une carte plus grande",
    es: "Abrir un mapa más grande",
  },
  rp_loc_looking: {
    de: "Adresse wird gesucht …",
    en: "Looking up the address …",
    fr: "Recherche de l’adresse …",
    es: "Buscando la dirección …",
  },

  /* ------------------------------------------- lockout and the map marker */
  lg_locked: {
    de: "Zu viele Versuche. Bitte {s} Sekunden warten.",
    en: "Too many attempts. Please wait {s} seconds.",
    fr: "Trop de tentatives. Attendez {s} secondes.",
    es: "Demasiados intentos. Espere {s} segundos.",
  },
  rp_map_hint: {
    de: "Marker verschieben oder auf die Karte tippen",
    en: "Drag the marker or tap the map",
    fr: "Déplacez le marqueur ou touchez la carte",
    es: "Arrastre el marcador o toque el mapa",
  },
  rp_map_recenter: {
    de: "Auf meinen Standort",
    en: "Back to my position",
    fr: "Revenir à ma position",
    es: "Volver a mi ubicación",
  },
  rp_loc_manual: {
    de: "Position von Hand gesetzt",
    en: "Position set by hand",
    fr: "Position définie à la main",
    es: "Posición fijada a mano",
  },

  /* ------------------------------------------------- adding a new category */
  cat_add_service: {
    de: "+ Neue Kategorie …",
    en: "+ New category …",
    fr: "+ Nouvelle catégorie …",
    es: "+ Nueva categoría …",
  },
  cat_service_name: {
    de: "Name der Kategorie",
    en: "Name of the category",
    fr: "Nom de la catégorie",
    es: "Nombre de la categoría",
  },
  cat_service_ph: {
    de: "z. B. Gas, Straßenbeleuchtung",
    en: "e.g. Gas, street lighting",
    fr: "p. ex. gaz, éclairage public",
    es: "p. ej. gas, alumbrado",
  },
  cat_service_hint: {
    de: "Für Probleme, die zu keiner der vorhandenen Sparten gehören.",
    en: "For problems that belong to none of the existing utilities.",
    fr: "Pour les problèmes qui ne relèvent d’aucun réseau existant.",
    es: "Para problemas que no pertenecen a ningún servicio existente.",
  },
};
