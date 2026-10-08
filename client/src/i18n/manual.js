/**
 * manual.js - the content of the in-app handbook, in four languages.
 *
 * Short on purpose: four sections that answer what the tool is for, how to
 * use it, what happens behind the scenes and what to do when something goes
 * wrong. Anything longer belongs in the PDF documentation.
 */

export const MANUAL = {
  de: [
    {
      icon: "🎯",
      title: "Wofür ist das?",
      body: [
        "Wenn Strom, Wasser, Abwasser oder Fernwärme ausfällt, müssen die Menschen in Plattling schnell Bescheid wissen.",
        "Mit dieser App ist eine Meldung in wenigen Sekunden geschrieben und geht auf allen Kanälen gleichzeitig raus – auch auf Englisch, Französisch und Spanisch.",
      ],
    },
    {
      icon: "🔄",
      title: "So geht es",
      steps: [
        "Auf Start auf „Störung melden“ tippen.",
        "Antippen, was passiert ist, und wo. Mehr braucht es nicht.",
        "Den fertigen Text lesen und auf „Jetzt senden“ tippen.",
        "Wenn die Störung behoben ist: auf Start auf „Behoben – Entwarnung senden“ tippen.",
      ],
    },
    {
      icon: "✍️",
      title: "Den Text ändern",
      body: [
        "Der Text entsteht automatisch aus Ihren Angaben – erfunden wird nichts.",
        "Auf der Seite „Senden“ können Sie ihn vorher mit „Text ändern“ anpassen.",
        "Oben rechts können Sie die Sprache umschalten und prüfen, wie die Meldung auf Englisch aussieht.",
      ],
    },
    {
      icon: "🔔",
      title: "Anmeldung und Benachrichtigungen",
      body: [
        "Beim Start fragt die App nach einer PIN. Sie gilt für das ganze Team und hält zwölf Stunden – einmal pro Schicht eingeben.",
        "Mit dem Glocken-Symbol oben rechts schalten Sie Benachrichtigungen für dieses Gerät ein. Danach meldet sich das Handy bei jeder Veröffentlichung, auch wenn die App geschlossen ist.",
        "Mit dem Schloss-Symbol melden Sie sich wieder ab.",
      ],
    },
    {
      icon: "📍",
      title: "Standort und Sprache",
      body: [
        "Auf der Melden-Seite können Sie mit „Standort verwenden“ die genaue Position übernehmen. Die App zeigt dazu, wie genau die Messung ist.",
        "Mit dem Mikrofon-Knopf diktieren Sie die Notiz. Die Erkennung läuft im Gerät, es wird nichts hochgeladen.",
        "Der Ton der Meldung passt sich der Lage an: geplante Arbeiten klingen ruhig, ein Abkochgebot klar und ernst, aber ohne Panik.",
      ],
    },
    {
      icon: "🕒",
      title: "Automatische Updates",
      body: [
        "Dauert eine Störung länger, schickt die App alle 30 Minuten von selbst eine kurze Zwischenmeldung.",
        "Ist die angekündigte Endzeit überschritten, wird sie ehrlich nach hinten verschoben statt sie zu wiederholen.",
        "Sobald Sie auf Start die Entwarnung senden, hören die automatischen Meldungen auf.",
      ],
    },
    {
      icon: "➕",
      title: "Fehlt etwas in der Liste?",
      body: [
        "Auf der Melden-Seite können Sie direkt ein neues Problem oder einen neuen Ort hinzufügen – mit dem gestrichelten Feld „Problem hinzufügen“ beziehungsweise „Ort hinzufügen“.",
        "Beim Problem wählen Sie die Sparte, die übliche Dauer und den Tonfall: beruhigend für geplante Arbeiten, sachlich für normale Störungen, ernst bei Gesundheitsbezug, leicht bei kleinen Einschränkungen.",
        "Selbst angelegte Einträge lassen sich mit „Entfernen“ wieder löschen. Die vorgegebenen bleiben immer erhalten.",
      ],
    },
    {
      icon: "🔒",
      title: "Mikrofon und Standort am Handy",
      body: [
        "Browser geben Mikrofon und Standort nur über eine sichere Verbindung frei. Auf dem Laptop unter localhost funktioniert beides sofort.",
        "Auf dem Handy über eine Adresse wie http://192.168.0.12:4000 sind beide gesperrt – die App sagt das dann auch deutlich.",
        "Lösung für unterwegs: einen Tunnel starten (zum Beispiel npx localtunnel --port 4000) und die https-Adresse auf dem Handy öffnen.",
        "Der Standort wird bis zu zwölf Sekunden lang verbessert. Die angezeigte Meterzahl sagt, wie genau die Messung gerade ist.",
      ],
    },
    {
      icon: "❓",
      title: "Wenn etwas klemmt",
      body: [
        "Erscheint eine Warnung über dem Senden-Knopf, fehlt eine Angabe im Text. Mit „Text ändern“ ergänzen.",
        "Wird nichts angezeigt, ist meist der Server nicht erreichbar. Dann die Seite neu laden.",
        "Dunkler Modus für die Nacht: Mond-Symbol oben rechts.",
      ],
    },
  ],

  en: [
    {
      icon: "🎯",
      title: "What is this for?",
      body: [
        "When electricity, water, wastewater or district heating fails, people in Plattling need to know quickly.",
        "With this app a notice is written in seconds and goes out on all channels at once, in German, English, French and Spanish.",
      ],
    },
    {
      icon: "🔄",
      title: "How it works",
      steps: [
        'On the home screen tap "Report an outage".',
        "Tap what happened and where. That is all it needs.",
        'Read the finished text and tap "Send now".',
        'When the outage is fixed, tap "Fixed - send the all-clear" on the home screen.',
      ],
    },
    {
      icon: "✍️",
      title: "Changing the text",
      body: [
        "The text is built automatically from your input - nothing is invented.",
        'On the Send screen you can adjust it with "Change the text" before sending.',
        "Use the dropdown at the top right to switch language and check how the notice reads in English.",
      ],
    },
    {
      icon: "🔔",
      title: "Signing in and notifications",
      body: [
        "The app asks for a PIN at the start. It belongs to the whole team and lasts twelve hours - once per shift is enough.",
        "The bell icon at the top right turns on notifications for this device. The phone then reports every publication, even with the app closed.",
        "The lock icon signs you out again.",
      ],
    },
    {
      icon: "📍",
      title: "Location and language",
      body: [
        'On the report screen, "Use my location" captures the exact position, together with how accurate the reading is.',
        "The microphone button dictates the note. Recognition runs on the device; nothing is uploaded.",
        "The tone of the message fits the situation: planned work sounds calm, a boil-water notice is clear and serious without causing panic.",
      ],
    },
    {
      icon: "🕒",
      title: "Automatic updates",
      body: [
        "If an outage runs long, the app sends a short status message by itself every 30 minutes.",
        "If the announced end time has passed, it is moved back honestly instead of being repeated.",
        "As soon as you send the all-clear on the home screen, the automatic messages stop.",
      ],
    },
    {
      icon: "➕",
      title: "Something missing from the list?",
      body: [
        'On the report screen you can add a new problem type or a new place directly - the dashed "Add a problem type" and "Add a place" fields.',
        "For a problem you choose the utility, the usual duration and the tone: reassuring for planned work, steady for normal outages, careful when health is involved, light for small inconveniences.",
        'Entries you added can be deleted again with "Remove". The built-in ones always stay.',
      ],
    },
    {
      icon: "🔒",
      title: "Microphone and location on a phone",
      body: [
        "Browsers only allow the microphone and the location over a secure connection. On the laptop under localhost both work straight away.",
        "On a phone, using an address like http://192.168.0.12:4000, both are blocked - the app now says so clearly instead of doing nothing.",
        "The way around it in the field: start a tunnel (for example npx localtunnel --port 4000) and open the https address on the phone.",
        "The position keeps improving for up to twelve seconds. The metre figure shows how accurate the current reading is.",
      ],
    },
    {
      icon: "❓",
      title: "If something goes wrong",
      body: [
        'A warning above the send button means a detail is missing from the text. Add it with "Change the text".',
        "If nothing is shown at all, the server is usually unreachable. Reload the page.",
        "Dark mode for night shifts: the moon icon at the top right.",
      ],
    },
  ],

  fr: [
    {
      icon: "🎯",
      title: "À quoi ça sert ?",
      body: [
        "Quand l’électricité, l’eau, l’assainissement ou le chauffage tombe en panne, les habitants doivent être informés vite.",
        "Avec cette application, un avis est rédigé en quelques secondes et part sur tous les canaux à la fois, en quatre langues.",
      ],
    },
    {
      icon: "🔄",
      title: "Comment faire",
      steps: [
        "Sur l’accueil, touchez « Signaler une panne ».",
        "Touchez ce qui s’est passé, puis où. C’est tout.",
        "Lisez le texte proposé et touchez « Envoyer maintenant ».",
        "Quand la panne est réparée, touchez « Réparé – envoyer la fin d’alerte » sur l’accueil.",
      ],
    },
    {
      icon: "✍️",
      title: "Modifier le texte",
      body: [
        "Le texte est créé automatiquement à partir de vos indications ; rien n’est inventé.",
        "Sur la page Envoyer, vous pouvez l’ajuster avec « Modifier le texte ».",
        "En haut à droite, changez de langue pour vérifier le rendu.",
      ],
    },
    {
      icon: "🔔",
      title: "Connexion et notifications",
      body: [
        "L’application demande un code au démarrage. Il vaut pour toute l’équipe et dure douze heures.",
        "L’icône de cloche en haut à droite active les notifications pour cet appareil, même application fermée.",
        "L’icône de cadenas permet de se déconnecter.",
      ],
    },
    {
      icon: "📍",
      title: "Position et langue",
      body: [
        "Sur la page de signalement, « Utiliser ma position » enregistre la position exacte et sa précision.",
        "Le bouton micro permet de dicter la note. La reconnaissance reste sur l’appareil.",
        "Le ton du message s’adapte : des travaux planifiés restent rassurants, une consigne d’ébullition est claire et sérieuse sans affoler.",
      ],
    },
    {
      icon: "🕒",
      title: "Mises à jour automatiques",
      body: [
        "Si une panne dure, l’application envoie d’elle-même un point de situation toutes les 30 minutes.",
        "Si l’heure annoncée est dépassée, elle est repoussée honnêtement.",
        "Dès que vous envoyez la fin d’alerte, les messages automatiques s’arrêtent.",
      ],
    },
    {
      icon: "➕",
      title: "Quelque chose manque dans la liste ?",
      body: [
        "Sur la page de signalement, vous pouvez ajouter un type de problème ou un lieu avec les champs en pointillés.",
        "Pour un problème, choisissez le réseau, la durée habituelle et le ton : rassurant pour des travaux planifiés, neutre pour une panne normale, sérieux si la santé est concernée, léger pour une gêne mineure.",
        "Les entrées que vous ajoutez peuvent être supprimées ; les entrées d’origine restent toujours.",
      ],
    },
    {
      icon: "🔒",
      title: "Micro et position sur téléphone",
      body: [
        "Les navigateurs n’autorisent le micro et la position que sur une connexion sécurisée. Sur l’ordinateur en localhost, tout fonctionne.",
        "Sur un téléphone, avec une adresse comme http://192.168.0.12:4000, les deux sont bloqués - l’application l’indique clairement.",
        "Solution sur le terrain : lancer un tunnel (par exemple npx localtunnel --port 4000) et ouvrir l’adresse https.",
        "La position s’affine pendant douze secondes au maximum. Le nombre de mètres indique la précision actuelle.",
      ],
    },
    {
      icon: "❓",
      title: "En cas de problème",
      body: [
        "Un avertissement au-dessus du bouton signifie qu’une information manque. Complétez avec « Modifier le texte ».",
        "Si rien ne s’affiche, le serveur est généralement injoignable. Rechargez la page.",
        "Mode sombre pour la nuit : icône de lune en haut à droite.",
      ],
    },
  ],

  es: [
    {
      icon: "🎯",
      title: "¿Para qué sirve?",
      body: [
        "Cuando falla la electricidad, el agua, el alcantarillado o la calefacción, los vecinos deben enterarse rápido.",
        "Con esta aplicación un aviso se redacta en segundos y sale por todos los canales a la vez, en cuatro idiomas.",
      ],
    },
    {
      icon: "🔄",
      title: "Cómo se usa",
      steps: [
        "En la pantalla de inicio pulse «Notificar una incidencia».",
        "Toque qué ha pasado y dónde. No hace falta más.",
        "Lea el texto generado y pulse «Enviar ahora».",
        "Cuando se resuelva, pulse «Resuelto: enviar fin de aviso» en la pantalla de inicio.",
      ],
    },
    {
      icon: "✍️",
      title: "Cambiar el texto",
      body: [
        "El texto se crea automáticamente con sus datos; no se inventa nada.",
        "En la pantalla Enviar puede ajustarlo con «Cambiar el texto».",
        "Arriba a la derecha puede cambiar de idioma y comprobar cómo queda.",
      ],
    },
    {
      icon: "🔔",
      title: "Acceso y notificaciones",
      body: [
        "La aplicación pide un PIN al iniciar. Es del equipo y dura doce horas.",
        "El icono de campana arriba a la derecha activa las notificaciones en este dispositivo, incluso con la app cerrada.",
        "El icono de candado cierra la sesión.",
      ],
    },
    {
      icon: "📍",
      title: "Ubicación e idioma",
      body: [
        "En la pantalla de aviso, «Usar mi ubicación» guarda la posición exacta y su precisión.",
        "El botón de micrófono dicta la nota. El reconocimiento se queda en el dispositivo.",
        "El tono del mensaje se adapta: un trabajo planificado suena tranquilo y un aviso de hervir el agua es claro y serio sin alarmar.",
      ],
    },
    {
      icon: "🕒",
      title: "Actualizaciones automáticas",
      body: [
        "Si una incidencia se alarga, la aplicación envía sola un breve estado cada 30 minutos.",
        "Si la hora anunciada ya pasó, se retrasa con honestidad en vez de repetirla.",
        "En cuanto envíe el fin de aviso, los mensajes automáticos se detienen.",
      ],
    },
    {
      icon: "➕",
      title: "¿Falta algo en la lista?",
      body: [
        "En la pantalla de aviso puede añadir un tipo de problema o un lugar con los campos punteados.",
        "Para un problema elija el servicio, la duración habitual y el tono: tranquilizador para trabajos planificados, neutro para una incidencia normal, serio si afecta a la salud, leve para molestias pequeñas.",
        "Las entradas que añada se pueden eliminar; las predefinidas se mantienen siempre.",
      ],
    },
    {
      icon: "🔒",
      title: "Micrófono y ubicación en el móvil",
      body: [
        "Los navegadores solo permiten el micrófono y la ubicación con una conexión segura. En el portátil con localhost funcionan sin más.",
        "En el móvil, con una dirección como http://192.168.0.12:4000, ambos están bloqueados; la aplicación ahora lo indica claramente.",
        "Solución sobre el terreno: abrir un túnel (por ejemplo npx localtunnel --port 4000) y usar la dirección https.",
        "La ubicación se afina durante un máximo de doce segundos. Los metros indican la precisión actual.",
      ],
    },
    {
      icon: "❓",
      title: "Si algo falla",
      body: [
        "Un aviso encima del botón significa que falta un dato en el texto. Añádalo con «Cambiar el texto».",
        "Si no aparece nada, normalmente el servidor no está disponible. Recargue la página.",
        "Modo oscuro para la noche: el icono de luna arriba a la derecha.",
      ],
    },
  ],
};
