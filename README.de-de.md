# geotagger-js
Das ist ein kleines JavaScript-Tool, um eigene Fotos mit Geotags zu versehen, die wiederum aus den Bewegungsdaten des Google Standortverlauf stammen. Das Tool kann über die `geotagger-js.html`-Datei direkt aufgerufen werden. Die Datei `wp-geotagger-js.php` kann in ein eigenes Wordpress-Theme eingebunden werden und das Tool dort zur Verfügung stellen.

Um die EXIF-Daten der Fotos zu lesen, nutze ich [Exif-js](https://github.com/exif-js/exif-js).

Mehr dazu und Beispiel: [Eintrag in meinem Blog (Deutsch)](https://blog.gestreift.net/knowhow/geotagging-mit-googles-standortverlauf/)

In anderen Sprachen lesen: [English](README.md)

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

![Screenshot](screenshot.jpg)

## Hintergrund

### Datenformat
Ich habe mich dazu entschieden, den Standortverlauf in das simple Array `timeline` zu überführen. Die Elemente des Arrays sind die einzelnen Tage, an denen GPS-Daten zugeordnet werden können. Ein Tag im Format `timeline['YYYY-MM-DD']` ist dann wiederum ein Array. Dessen Elemente sind dann ein Objekt aus den eigentlichen Daten. Ein Element im Array könnte also wie folgt aussehen:
```
timeline['2022-03-20'][3].theDate;   // Instanz des Date-Objektes
timeline['2022-03-20'][3].theLat;    // Latitude
timeline['2022-03-20'][3].theLon;    // Longitude
timeline['2022-03-20'][3].theAction; // Quelle des Datenpunktes
```

Der Eintrag `theAction` ist dabei nur eine informative Zeichenkette und wird derzeit nicht weiter verwendet. Das Array aus den Objekten ist nach der Zeit sortiert.

Um das Array zu befüllen, wird die Funktion `addWaypoint(theDate, theLat, theLong, theAction)` aufgerufen. 

### Google JSON Dateien
Das Format der Dateien ist etwas ernüchternd. Es gibt ja die Definition von GeoJSON-Dateien, die einen Standard bilden. Dieses Format ist es nicht. Aber immerhin ist es eine Standard-JSON-Datei.

Jedes Element des großen Arrays besteht aus mehreren mehr oder weniger spannenden Blöcken. Die interessanten Blöcke sind die folgenden:

* **activitySegment:** Hier wird eine Aktivität beschrieben. Lustig ist, dass man hier je Aktivität ein Ranking von Google sieht, wie wahrscheinlich welche Art der Fortbewegung ist. 
* **activitySegment.simplifiedRawPath:** Das ist eine Untergruppe des activitySegment’s, die selbst noch einmal Wegpunkte mit Zeitangaben beinhaltet.
* **placeVisit:** Hier steht, von wann bis wann man an welchem Ort war. Neben den für mich spannenden Koordinaten, steht hier auch wieder ein Ranking mit Wahrscheinlichkeiten, welche konkreten Orte es denn gewesen sein könnten.

In der Funktion `parseWalk(timeline)` wird jeweils ein Objekt aus dem JSON-Array übergeben. Daraus werden Wegpunkte extrahiert und dann in das eigene Datenformat überführt.
