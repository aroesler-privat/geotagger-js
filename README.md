# geotagger-js
This is a small JavaScript tool to geotag your own photos, which in turn are derived from Google location history movement data. The tool can be called directly via the `geotagger-js.html` file. The `wp-geotagger-js.php` file can be included in a custom Wordpress theme and make the tool available there.

To read the EXIF data of the photos I use [Exif-js](https://github.com/exif-js/exif-js).

More about this and example: [entry in my blog (German)](https://blog.gestreift.net/knowhow/geotagging-mit-googles-standortverlauf/)

Read in other languages: [Deutsch](README.de-de.md)

## Installation as standalone tool
Download the directory `assets` and the file `geotagger-js.html` and place them exactly like this in a folder. If you now open the local file geotagger-js.html with the internet browser of your choice (e.g. file:///home/name/dir/geotagger-js.html), you should directly see this picture:


## Installation in a Wordpress theme
Load the directory `assets` and the file `wp-geotagger-js.php` into your theme directory. In the file `functions.php` geotagger-js is then included as follows:
```
require_once('geotagger-js/wp-geotagger-js.php');
```

From now on the tool can be included with the shortcode `[geotagger_js master_class="geotagger-js"]` on any page or post. The optional parameter `master_class` specifies the name of a CSS class in case the default class conflicts with the theme.

## Operation
Visit [Google Takeout](https://takeout.google.com/settings/takeout/custom/location_history) to download your location history. You'll need the data in JSON format. Google doesn't offer anything else as of today (March 2022) anyway. 

You can now load the JSON files from Google via drag & drop or via the file dialog. In the next step you can select one or more images.

If GPS data can be found in the Google dataset at least on the day the photo was taken, the tool will display the ones closest to the photo. With two buttons you can either copy the coordinates to the clipboard or use the appropriate 'exiftool' command with all parameters to store the GPS data in the EXIF record of the photo.

![Screenshot](screenshot.jpg)

## Background

### Data format
I decided to transfer the location history into the simple array 'timeline'. The elements of the array are the individual days to which GPS data can be assigned. A tag in the format `timeline['YYYY-MM-DD']` is then again an array. Its elements are then an object from the actual data. So an element in the array could look like this:
```
timeline['2022-03-20'][3].theDate; // Instance of the Date object
timeline['2022-03-20'][3].theLat; // Latitude
timeline['2022-03-20'][3].theLon; // Longitude
timeline['2022-03-20'][3].theAction; // Source of the data point
```

The entry `theAction` is only an informative string and is currently not used any further. The array of objects is sorted by time.

To populate the array, the function `addWaypoint(theDate, theLat, theLong, theAction)` is called. 

### Google JSON files
The format of the files is a bit sobering. After all, there is the definition of GeoJSON files, which form a standard. This format is not. But at least it is a standard JSON file.

Each element of the large array consists of several more or less exciting blocks. The interesting blocks are the following:

* **activitySegment:** Here an activity is described. Funny thing is that here you can see a ranking from Google per activity, how likely what kind of locomotion is. 
* **activitySegment.simplifiedRawPath:** This is a subset of the activitySegment's, which itself contains waypoints with time information.
* **placeVisit:** This tells you from when to when you were at which place. Beside the for me exciting coordinates, there is again a ranking with probabilities, which concrete places it could have been.

In the function `parseWalk(timeline)` an object from the JSON array is passed in each case. Waypoints are extracted from this and then transferred into the custom data format.
