# geotagger-js
Das ist ein kleines JavaScript-Tool, um eigene Fotos mit Geotags zu versehen, die wiederum aus den Bewegungsdaten des Google Standortverlauf stammen. Das Tool kann über die `geotagger-js.html`-Datei direkt aufgerufen werden. Die Datei `wp-geotagger-js.php` kann in ein eigenes Wordpress-Theme eingebunden werden und das Tool dort zur Verfügung stellen.

Um die EXIF-Daten der Fotos zu lesen, nutze ich [Exif-js](https://github.com/exif-js/exif-js).

Mehr dazu und Beispiel: [Eintrag in meinem Blog (Deutsch)](https://blog.gestreift.net/knowhow/geotagging-mit-googles-standortverlauf/)

## Installation als eigenständiges Tool
Lade das Verzeichnis `assets` und die Datei `geotagger-js.html` herunter und platziere sie genau so in einem Ordner. Wenn Du jetzt mit dem Internetbrowser Deiner Wahl die lokale Datei geotagger-js.html öffnest (z.B. file:///home/name/dir/geotagger-js.html), dann solltest Du direkt dieses Bild sehen:


## Installation in einem Wordpress-Theme
Lade das Verzeichnis `assets` und die Datei `wp-geotagger-js.php` in Dein Theme-Verzeichnis. In der Datei `functions.php` wird geotagger-js dann wie folgt eingebunden:
```
require_once('geotagger-js/wp-geotagger-js.php');
```

Von nun an kann das Tool mit dem Shortcode `[geotagger_js master_class="geotagger-js"]` auf beliebigen Seiten oder Posts eingebunden werden. Der optionale Parameter `master_class` gibt den Namen einer CSS-Klasse an, falls die Standardklasse mit dem Theme kollidieren sollte.

## Bedienung
Besuche [Google Takeout](https://takeout.google.com/settings/takeout/custom/location_history), um Deinen Standortverlauf herunterzuladen. Du benötigst die Daten im JSON-Format. Google bietet Stand heute (März 2022) sowieso nichts anderes an. 

Die JSON-Dateien von Google kannst Du jetzt per Drag & Drop oder über die Datei-Dialog laden. Im nächsten Schritt kannst Du ein oder mehrere Bilder auswählen.

Können zumindest am Tag der Aufnahme des Fotos GPS-Daten im Google-Datensatz gefunden, so zeigt das Tool die der Aufnahme am nächsten liegenden an. Über zwei Buttons können entweder die Koordinaten ins die Zwischenablage kopiert werden, oder der passende `exiftool`-Befehl mit allen Parametern, um die GPS-Daten im EXIF-Datensatz des Fotos zu hinterlegen.
