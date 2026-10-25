/**
 * manual.js - the content of the in-app handbook, in four languages.
 *
 * Short on purpose: four sections that answer what the tool is for, how to
 * use it, what happens behind the scenes and what to do when something goes
 * wrong. Anything longer belongs in the PDF documentation.
 */

import { IconLookup } from "../ui/Icons.jsx";

export const MANUAL = {
  de: [
    {
      icon: "target",
      title: "Wofür ist das?",
      body: [
        "Wenn Strom, Wasser, Abwasser oder Fernwärme ausfällt, müssen die Menschen in Plattling schnell Bescheid wissen.",
        "Mit dieser App ist eine Meldung in wenigen Sekunden geschrieben und geht auf allen Kanälen gleichzeitig raus – auch auf Englisch, Französisch und Spanisch.",
      ],
    },
    {
      icon: "refresh",
      title: "So geht es",
      steps: [
        "Auf Start auf „Störung melden“ tippen.",
        "Antippen, was passiert ist, und wo. Mehr braucht es nicht.",
        "Den fertigen Text lesen und auf „Jetzt senden“ tippen.",
        "Wenn die Störung behoben ist: auf Start auf „Behoben – Entwarnung senden“ tippen.",
      ],
    },
    {
      icon: "edit",
      title: "Den Text ändern",
      body: [
        "Der Text entsteht automatisch aus Ihren Angaben – erfunden wird nichts.",
        "Auf der Seite „Senden“ können Sie ihn vorher mit „Text ändern“ anpassen.",
        "Oben rechts können Sie die Sprache umschalten und prüfen, wie die Meldung auf Englisch aussieht.",
      ],
    },
    {
      icon: "bell",
      title: "Anmeldung und Benachrichtigungen",
      body: [
        "Beim Start fragt die App nach einer PIN. Jeder Mitarbeiter hat eine eigene persönliche PIN (mindestens 6 Ziffern), die zwölf Stunden hält – einmal pro Schicht eingeben.",
        "Mit dem Glocken-Symbol oben rechts schalten Sie Benachrichtigungen für dieses Gerät ein. Danach meldet sich das Handy bei jeder Veröffentlichung, auch wenn die App geschlossen ist.",
        "Mit dem Abmelden-Symbol melden Sie sich wieder ab.",
      ],
    },
    {
      icon: "mapPin",
      title: "Standort und Sprache",
      body: [
        "Auf der Melden-Seite können Sie mit „Standort verwenden“ die genaue Position übernehmen. Die App zeigt dazu, wie genau die Messung ist.",
        "Mit dem Mikrofon-Knopf diktieren Sie die Notiz. Die Erkennung läuft im Gerät, es wird nichts hochgeladen.",
        "Der Ton der Meldung passt sich der Lage an: geplante Arbeiten klingen ruhig, ein Abkochgebot klar und ernst, aber ohne Panik.",
      ],
    },
    {
      icon: "clock",
      title: "Automatische Updates",
      body: [
        "Dauert eine Störung länger, schickt die App alle 30 Minuten von selbst eine kurze Zwischenmeldung.",
        "Ist die angekündigte Endzeit überschritten, wird sie ehrlich nach hinten verschoben statt sie zu wiederholen.",
        "Sobald Sie auf Start die Entwarnung senden, hören die automatischen Meldungen auf.",
        "In der Genehmigungs-Ansicht sehen Sie mit dem Badge, ob eine Meldung automatisch vom System gesendet wurde.",
      ],
    },
    {
      icon: "warning",
      title: "Kritische Meldungen",
      body: [
        "Gesundheitsrelevante Meldungen (z. B. Abkochgebot) werden als kritisch markiert.",
        "Bei kritischen Meldungen erscheint eine Warnung vor dem Senden, um besonders sorgfältig zu prüfen.",
        "Diese Warnung erinnert das Team, dass die Meldung besondere Aufmerksamkeit erfordert.",
      ],
    },
    {
      icon: "plus",
      title: "Fehlt etwas in der Liste?",
      body: [
        "Auf der Melden-Seite können Sie direkt ein neues Problem oder einen neuen Ort hinzufügen – mit dem gestrichelten Feld „Problem hinzufügen“ beziehungsweise „Ort hinzufügen“.",
        "Beim Problem wählen Sie die Sparte, die übliche Dauer und den Tonfall: beruhigend für geplante Arbeiten, sachlich für normale Störungen, ernst bei Gesundheitsbezug, leicht bei kleinen Einschränkungen.",
        "Selbst angelegte Einträge lassen sich mit „Entfernen“ wieder löschen. Die vorgegebenen bleiben immer erhalten.",
      ],
    },
    {
      icon: "lock",
      title: "Mikrofon und Standort",
      body: [
        "Mikrofon und Standort funktionieren nur über die offizielle https-Adresse.",
        "Der Standort wird bis zu zwölf Sekunden lang verbessert. Die angezeigte Meterzahl sagt, wie genau die Messung gerade ist.",
      ],
    },
    {
      icon: "help",
      title: "Wenn die App nicht funktioniert",
      body: [
        "Erscheint eine Warnung über dem Senden-Knopf, fehlt eine Angabe im Text. Mit „Text ändern“ ergänzen.",
        "Wird nichts angezeigt, ist meist der Server nicht erreichbar. Dann die Seite neu laden.",
        "Dunkler Modus für die Nacht: Mond-Symbol oben rechts.",
        "Bei anhaltenden Problemen: {{NOTFALL_TELEFON}}",
      ],
    },
  ],

  en: [
    {
      icon: "target",
      title: "What is this for?",
      body: [
        "When electricity, water, wastewater or district heating fails, people in Plattling need to know quickly.",
        "With this app a notice is written in seconds and goes out on all channels at once, in German, English, French and Spanish.",
      ],
    },
    {
      icon: "refresh",
      title: "How it works",
      steps: [
        'On the home screen tap "Report an outage".',
        "Tap what happened and where. That is all it needs.",
        'Read the finished text and tap "Send now".',
        'When the outage is fixed, tap "Fixed - send the all-clear" on the home screen.',
      ],
    },
    {
      icon: "edit",
      title: "Changing the text",
      body: [
        "The text is built automatically from your input - nothing is invented.",
        'On the Send screen you can adjust it with "Change the text" before sending.',
        "Use the dropdown at the top right to switch language and check how the notice reads in English.",
      ],
    },
    {
      icon: "bell",
      title: "Signing in and notifications",
      body: [
        "The app asks for a PIN at the start. Each worker has their own personal PIN (at least 6 digits), which lasts twelve hours - once per shift is enough.",
        "The bell icon at the top right turns on notifications for this device. The phone then reports every publication, even with the app closed.",
        "The logout icon signs you out again.",
      ],
    },
    {
      icon: "mapPin",
      title: "Location and language",
      body: [
        'On the report screen, "Use my location" captures the exact position, together with how accurate the reading is.',
        "The microphone button dictates the note. Recognition runs on the device; nothing is uploaded.",
        "The tone of the message fits the situation: planned work sounds calm, a boil-water notice is clear and serious without causing panic.",
      ],
    },
    {
      icon: "clock",
      title: "Automatic updates",
      body: [
        "If an outage runs long, the app sends a short status message by itself every 30 minutes.",
        "If the announced end time has passed, it is moved back honestly instead of being repeated.",
        "As soon as you send the all-clear on the home screen, the automatic messages stop.",
        "In the approval screen, the badge shows whether a message was sent automatically by the system.",
      ],
    },
    {
      icon: "warning",
      title: "Critical notices",
      body: [
        "Health-relevant notices (e.g., boil-water advisory) are marked as critical.",
        "For critical notices, a warning appears before sending to prompt extra careful review.",
        "This warning reminds the team that the notice requires special attention.",
      ],
    },
    {
      icon: "plus",
      title: "Something missing from the list?",
      body: [
        'On the report screen you can add a new problem type or a new place directly - the dashed "Add a problem type" and "Add a place" fields.',
        "For a problem you choose the utility, the usual duration and the tone: reassuring for planned work, steady for normal outages, careful when health is involved, light for small inconveniences.",
        'Entries you added can be deleted again with "Remove". The built-in ones always stay.',
      ],
    },
    {
      icon: "lock",
      title: "Microphone and location",
      body: [
        "Microphone and location only work over the official https address.",
        "The position keeps improving for up to twelve seconds. The metre figure shows how accurate the current reading is.",
      ],
    },
    {
      icon: "help",
      title: "If the app is not working",
      body: [
        'A warning above the send button means a detail is missing from the text. Add it with "Change the text".',
        "If nothing is shown at all, the server is usually unreachable. Reload the page.",
        "Dark mode for night shifts: the moon icon at the top right.",
        "For persistent problems: {{NOTFALL_TELEFON}}",
      ],
    },
  ],

  fr: [
    {
      icon: "target",
      title: "À quoi ça sert ?",
      body: [
        "Quand l’électricité, l’eau, l’assainissement ou le chauffage tombe en panne, les habitants doivent être informés vite.",
        "Avec cette application, un avis est rédigé en quelques secondes et part sur tous les canaux à la fois, en quatre langues.",
      ],
    },
    {
      icon: "refresh",
      title: "Comment faire",
      steps: [
        "Sur l’accueil, touchez « Signaler une panne ».",
        "Touchez ce qui s’est passé, puis où. C’est tout.",
        "Lisez le texte proposé et touchez « Envoyer maintenant ».",
        "Quand la panne est réparée, touchez « Réparé – envoyer la fin d’alerte » sur l’accueil.",
      ],
    },
    {
      icon: "edit",
      title: "Modifier le texte",
      body: [
        "Le texte est créé automatiquement à partir de vos indications ; rien n’est inventé.",
        "Sur la page Envoyer, vous pouvez l’ajuster avec « Modifier le texte ».",
        "En haut à droite, changez de langue pour vérifier le rendu.",
      ],
    },
    {
      icon: "bell",
      title: "Connexion et notifications",
      body: [
        "L’application demande un code au démarrage. Il vaut pour toute l’équipe et dure douze heures.",
        "L’icône de cloche en haut à droite active les notifications pour cet appareil, même application fermée.",
        "L’icône de cadenas permet de se déconnecter.",
      ],
    },
    {
      icon: "mapPin",
      title: "Position et langue",
      body: [
        "Sur la page de signalement, « Utiliser ma position » enregistre la position exacte et sa précision.",
        "Le bouton micro permet de dicter la note. La reconnaissance reste sur l’appareil.",
        "Le ton du message s’adapte : des travaux planifiés restent rassurants, une consigne d’ébullition est claire et sérieuse sans affoler.",
      ],
    },
    {
      icon: "clock",
      title: "Mises à jour automatiques",
      body: [
        "Si une panne dure, l’application envoie d’elle-même un point de situation toutes les 30 minutes.",
        "Si l’heure annoncée est dépassée, elle est repoussée honnêtement.",
        "Dès que vous envoyez la fin d’alerte, les messages automatiques s’arrêtent.",
        "Dans l'écran d'approbation, le badge 🤖 indique si un message a été envoyé automatiquement par le système.",
      ],
    },
    {
      icon: "warning",
      title: "Avis critiques",
      body: [
        "Les avis pertinents pour la santé (ex: consigne d'ébullition) sont marqués comme critiques.",
        "Pour les avis critiques, un avertissement apparaît avant l'envoi pour inviter à une vérification particulièrement soigneuse.",
        "Cet avertissement rappelle à l'équipe que l'avis nécessite une attention particulière.",
      ],
    },
    {
      icon: "plus",
      title: "Quelque chose manque dans la liste ?",
      body: [
        "Sur la page de signalement, vous pouvez ajouter un type de problème ou un lieu avec les champs en pointillés.",
        "Pour un problème, choisissez le réseau, la durée habituelle et le ton : rassurant pour des travaux planifiés, neutre pour une panne normale, sérieux si la santé est concernée, léger pour une gêne mineure.",
        "Les entrées que vous ajoutez peuvent être supprimées ; les entrées d’origine restent toujours.",
      ],
    },
    {
      icon: "lock",
      title: "Micro et position",
      body: [
        "Le micro et la position ne fonctionnent que sur l'adresse https officielle.",
        "La position s'affine pendant douze secondes au maximum. Le nombre de mètres indique la précision actuelle.",
      ],
    },
    {
      icon: "help",
      title: "Si l'application ne fonctionne pas",
      body: [
        "Un avertissement au-dessus du bouton signifie qu’une information manque. Complétez avec « Modifier le texte ».",
        "Si rien ne s’affiche, le serveur est généralement injoignable. Rechargez la page.",
        "Mode sombre pour la nuit : icône de lune en haut à droite.",
        "Pour les problèmes persistants : {{NOTFALL_TELEFON}}",
      ],
    },
  ],

  es: [
    {
      icon: "target",
      title: "¿Para qué sirve?",
      body: [
        "Cuando falla la electricidad, el agua, el alcantarillado o la calefacción, los vecinos deben enterarse rápido.",
        "Con esta aplicación un aviso se redacta en segundos y sale por todos los canales a la vez, en cuatro idiomas.",
      ],
    },
    {
      icon: "refresh",
      title: "Cómo se usa",
      steps: [
        "En la pantalla de inicio pulse «Notificar una incidencia».",
        "Toque qué ha pasado y dónde. No hace falta más.",
        "Lea el texto generado y pulse «Enviar ahora».",
        "Cuando se resuelva, pulse «Resuelto: enviar fin de aviso» en la pantalla de inicio.",
      ],
    },
    {
      icon: "edit",
      title: "Cambiar el texto",
      body: [
        "El texto se crea automáticamente con sus datos; no se inventa nada.",
        "En la pantalla Enviar puede ajustarlo con «Cambiar el texto».",
        "Arriba a la derecha puede cambiar de idioma y comprobar cómo queda.",
      ],
    },
    {
      icon: "bell",
      title: "Acceso y notificaciones",
      body: [
        "La aplicación pide un PIN al iniciar. Es del equipo y dura doce horas.",
        "El icono de campana arriba a la derecha activa las notificaciones en este dispositivo, incluso con la app cerrada.",
        "El icono de candado cierra la sesión.",
      ],
    },
    {
      icon: "mapPin",
      title: "Ubicación e idioma",
      body: [
        "En la pantalla de aviso, «Usar mi ubicación» guarda la posición exacta y su precisión.",
        "El botón de micrófono dicta la nota. El reconocimiento se queda en el dispositivo.",
        "El tono del mensaje se adapta: un trabajo planificado suena tranquilo y un aviso de hervir el agua es claro y serio sin alarmar.",
      ],
    },
    {
      icon: "clock",
      title: "Actualizaciones automáticas",
      body: [
        "Si una incidencia se alarga, la aplicación envía sola un breve estado cada 30 minutos.",
        "Si la hora anunciada ya pasó, se retrasa con honestidad en vez de repetirla.",
        "En cuanto envíe el fin de aviso, los mensajes automáticos se detienen.",
        "En la pantalla de aprobación, el badge 🤖 muestra si un mensaje fue enviado automáticamente por el sistema.",
      ],
    },
    {
      icon: "warning",
      title: "Avisos críticos",
      body: [
        "Los avisos relevantes para la salud (ej: aviso de hervir el agua) se marcan como críticos.",
        "Para avisos críticos, aparece una advertencia antes de enviar para revisar con especial cuidado.",
        "Esta advertencia recuerda al equipo que el aviso requiere atención especial.",
      ],
    },
    {
      icon: "plus",
      title: "¿Falta algo en la lista?",
      body: [
        "En la pantalla de aviso puede añadir un tipo de problema o un lugar con los campos punteados.",
        "Para un problema elija el servicio, la duración habitual y el tono: tranquilizador para trabajos planificados, neutro para una incidencia normal, serio si afecta a la salud, leve para molestias pequeñas.",
        "Las entradas que añada se pueden eliminar; las predefinidas se mantienen siempre.",
      ],
    },
    {
      icon: "lock",
      title: "Micrófono y ubicación",
      body: [
        "El micrófono y la ubicación solo funcionan en la dirección https oficial.",
        "La ubicación se afina durante un máximo de doce segundos. Los metros indican la precisión actual.",
        "La ubicación se afina durante un máximo de doce segundos. Los metros indican la precisión actual.",
      ],
    },
    {
      icon: "help",
      title: "Si la aplicación no funciona",
      body: [
        "Un aviso encima del botón significa que falta un dato en el texto. Añádalo con «Cambiar el texto».",
        "Si no aparece nada, normalmente el servidor no está disponible. Recargue la página.",
        "Modo oscuro para la noche: el icono de luna arriba a la derecha.",
        "Para problemas persistentes: {{NOTFALL_TELEFON}}",
      ],
    },
  ],
};
