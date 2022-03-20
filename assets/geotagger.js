/* ***********************************************************************
 * functions to load files exported via
 * -> https://takeout.google.com/settings/takeout/custom/location_history
 * into an array of dates and locations to somehow deal with them
 * *********************************************************************** */

var timeline = [];

/* -----------------------------------------------------------------------
   Helper function to transform the element defined as 'id' as a drop-area
   to drag&drop files to. Calls 'addActionFunction' when files have been
   dropped. MUST BE CALLED AFTER THE ELEMENT 'id' HAS BEEN CREATED!
   ----------------------------------------------------------------------- */
function addDropArea(id, addActionFunction)
{
	let dropArea = document.getElementById(id);

	['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => 
	{
		dropArea.addEventListener(eventName, preventDefaults, false)
	});

	function preventDefaults (e) 
	{
		e.preventDefault()
		e.stopPropagation()
	}

	['dragenter', 'dragover'].forEach(eventName => 
	{
		dropArea.addEventListener(eventName, highlight, false)
	});

	['dragleave', 'drop'].forEach(eventName => 
	{
		dropArea.addEventListener(eventName, unhighlight, false)
	});

	function highlight(e) 
	{
		dropArea.classList.add('highlight')
	}

	function unhighlight(e) 
	{
		dropArea.classList.remove('highlight')
	}

	dropArea.addEventListener('drop', handleDrop, false);

	function handleDrop(e) 
	{
		let dt = e.dataTransfer
		let files = dt.files
		addActionFunction(files);
	}
}

/* -----------------------------------------------------------------------
   helper function to get out of the timeline-array:
   -> ['first']       -> oldest date
   -> ['last']        -> most recent date
   -> ['daysTotal']   -> amount of days covered
   -> ['days']        -> days with datasets
   -> ['waypoints']   -> amount of waypoints in dataset
   -> ['waypointMax'] -> biggest amount of waypoints per day
   ----------------------------------------------------------------------- */
Array.prototype.getStatistics = function()
{
	var stat = new Object();

	let days = Object.keys(this);
	days.sort();

	stat.first = this[days[0]][0].theDate;
	stat.last  = this[days[days.length-1]][this[days[days.length-1]].length-1].theDate;

	stat.daysTotal = Math.round((stat['last']-stat['first'])/(1000*60*60*24));
	stat.days      = days.length;

	stat.waypoints = 0;
	stat.waypointMax = 0;

	for (arr in this)
	{
		stat.waypoints  += this[arr].length;
		stat.waypointMax = this[arr].length > stat.waypointMax ? this[arr].length : stat.waypointMax;
	}

	return stat;
}

/* -----------------------------------------------------------------------
   function to add a waypoint to the global timeline
   -> timestamp (Date-object)
   -> latitude in Google JSON E7-format
   -> longitude in Google JSON E7-format
   -> just a string describing the action
   ----------------------------------------------------------------------- */
function addWaypoint(theDate, theLat, theLong, theAction)
{
	var theDay = theDate.getFullYear() + '-' + theDate.getMonth() + '-' + theDate.getDate();
	var index = 0;

	/* if there are alreay entries for this day ... */
	if ( typeof timeline[theDay] != "undefined" )
	{
		index = timeline[theDay].length;

		/* ... sort this entry by its timestamp in the correct position */
		while ( index > 0 && timeline[theDay][index-1].theDate > theDate )
		{
			timeline[theDay][index] = timeline[theDay][index-1];
			index = index - 1;
		}

	} else {

		/* else just create an empty array for this day */
		timeline[theDay] = [];
	}

	timeline[theDay][index] = new Object();
	timeline[theDay][index].theDate   = theDate;
	timeline[theDay][index].theLat    = theLat * 0.0000001;
	timeline[theDay][index].theLong   = theLong * 0.0000001;
	timeline[theDay][index].theAction = theAction;
}

/* -----------------------------------------------------------------------
   function to walk through an element out of the timeline-array and add
   waypoints to the global array of waypoints
   -> parameter: an element ouf of the timeline-array
   ----------------------------------------------------------------------- */
function parseWalk(timeline)
{
	/* just in case ... */
	if (typeof timeline != "object") return null;

	/* in this case the timeline-element is something like a walk */
	if (typeof timeline.activitySegment == "object")
	{
		start = new Date(timeline.activitySegment.duration.startTimestamp);
		end   = new Date(timeline.activitySegment.duration.endTimestamp);

		addWaypoint(
			start, 
			timeline.activitySegment.startLocation.latitudeE7, 
			timeline.activitySegment.startLocation.longitudeE7, 
			"activitySegment"
		);
		addWaypoint(
			end, 
			timeline.activitySegment.endLocation.latitudeE7, 
			timeline.activitySegment.endLocation.longitudeE7, 
			"activitySegment"
		);

		/* something like walks may have additional waypoints with timestamps */
		if (typeof timeline.activitySegment.simplifiedRawPath == "object" && typeof timeline.activitySegment.simplifiedRawPath.points == "object")
		{
			for ( let i=0 ; i<timeline.activitySegment.simplifiedRawPath.points.length ; i++ )
			{
				addWaypoint(
					new Date(timeline.activitySegment.simplifiedRawPath.points[i].timestamp),
					timeline.activitySegment.simplifiedRawPath.points[i].latE7,
					timeline.activitySegment.simplifiedRawPath.points[i].lngE7,
					"simplifiedRawPath"
					);
			}
		}
	}

	/* in this case the timeline-element is a static place */
	if (typeof timeline.placeVisit == "object")
	{
		start = new Date(timeline.placeVisit.duration.startTimestamp);
		end   = new Date(timeline.placeVisit.duration.endTimestamp);

		addWaypoint(
			start, 
			timeline.placeVisit.location.latitudeE7, 
			timeline.placeVisit.location.longitudeE7, 
			"placeVisit"
		);
		addWaypoint(
			end, 
			timeline.placeVisit.location.latitudeE7, 
			timeline.placeVisit.location.longitudeE7, 
			"placeVisit"
		);
	}
}

/* -----------------------------------------------------------------------
   little helper-function to walk through every timeline-element in 
   Googles JSON array
   ----------------------------------------------------------------------- */
function parseTimeline(timelineArray)
{
	for ( let i=0 ; i<timelineArray.length ; i++ )
	{
		parseWalk(timelineArray[i]);
	}
}

function drawCanvasJSON(stat)
{
	let canvas = document.getElementById('geotagger-js-statistics-canvas');

	if (!canvas.getContext) 
	{
		return;
	}

	let width  = canvas.width;
	let height = canvas.height;
	let ctx    = canvas.getContext('2d');

	// empty the canvas
	let root = getComputedStyle(document.querySelector(':root'));
	ctx.fillStyle = root.getPropertyValue('--highlight');
	ctx.fillRect(0, 0, width, height);

	// set line stroke and line width
	ctx.strokeStyle = 'rgba(255,255,255,0.4)';
	ctx.lineWidth = 1;

	for (arr in timeline)
	{
		if (typeof timeline[arr] == "object")
		{
			y = Math.round(timeline[arr].length*height/stat.waypointMax);
			x = Math.round((((timeline[arr][0].theDate - stat.first)/(1000*60*60*24))/stat.daysTotal)*width);

			// draw a line
			ctx.beginPath();
			ctx.moveTo(x, height-y);
			ctx.lineTo(x, height);
			ctx.stroke();
		}
	}
}

/* -----------------------------------------------------------------------
   triggers when Google JSON-files have been selected
   ----------------------------------------------------------------------- */
function handleJSON(fileList)
{
	/* reset all variables when loading JSON-files */
	timeline = [];
	let filesToGo = fileList.length;

	/* read the file(s) */
	for ( let i=0 ; i<fileList.length ; i++ )
	{
		var fr = new FileReader(); 

		/* the callback with the file's content will be in e.target.result */
		fr.onload = function(e)
		{
			/* only go on when the content is JSON */
			try {
				var js = JSON.parse(e.target.result);
			} catch(e) {
				console.log("no JSON");
				return false;
			}

			parseTimeline(js.timelineObjects);
		};

		/* do some statistics when finished */
		fr.onloadend = function(e)
		{
			/* filesToGo goes down from fileList.length to zero when all files are loaded */
			filesToGo--;

			if (filesToGo == 0)
			{
				statDiv = document.getElementById('geotagger-js-statistics');
				statDiv.style.display = "block";

				stepDivs = document.getElementById('geotagger-js-dragdrop-waypoints').getElementsByClassName('step');
				stepDivs[0].style.display = "none";

				stat = timeline.getStatistics();
				drawCanvasJSON(stat);

				val = document.getElementById('geotagger-js-statistics-from');
				val.innerHTML = stat.first.toDateString();

				val = document.getElementById('geotagger-js-statistics-to');
				val.innerHTML = stat.last.toDateString();

				val = document.getElementById('geotagger-js-statistics-days');
				val.innerHTML = stat.days + "/" + stat.daysTotal;

				val = document.getElementById('geotagger-js-statistics-waypoints');
				val.innerHTML = stat.waypoints;

				val = document.getElementById('geotagger-js-images');
				if (val.classList.contains("disabled")) 
				{
					val.classList.remove("disabled");
				}
			}
		}

		fr.readAsText(fileList[i]);
	}
}
/* -----------------------------------------------------------------------
   function to be called via onClick="copyToCliboard(\"Text\")" to copy
   "Text" into the clipboard
   taken from: https://stackoverflow.com/a/33928558 
   ----------------------------------------------------------------------- */
function copyToClipboard(text) 
{
	if (window.clipboardData && window.clipboardData.setData) 
	{
		// Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
		return window.clipboardData.setData("Text", text);
	}
	else if (document.queryCommandSupported && document.queryCommandSupported("copy")) 
	{
		var textarea = document.createElement("textarea");
		textarea.textContent = text;
		textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
		document.body.appendChild(textarea);
		textarea.select();
		try {
			return document.execCommand("copy");  // Security exception may be thrown by some browsers.
		}
		catch (ex) {
			console.warn("Copy to clipboard failed.", ex);
			return prompt("Copy to clipboard: Ctrl+C, Enter", text);
		}
		finally {
			document.body.removeChild(textarea);
		}
	}
}

/* -----------------------------------------------------------------------
   helper function to make a row in the list of results unclickable in 
   case data is missing
   ----------------------------------------------------------------------- */
function disableRow(pid, msg)
{
	let fix    = document.getElementById(pid + "_fix_preferred");
	fix.innerHTML = msg;

	let result = document.getElementById(pid).closest(".result");
	result.style.opacity = "0.4";
	result.style.pointerEvents = "none";
}

/* -----------------------------------------------------------------------
   FIXME unused for now
   function to guess the address or name of given coordinates via OSM
   ----------------------------------------------------------------------- */
function guessThePlace(pid, loc)
{
	var url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + loc.theLat + "&lon=" + loc.theLong + "&addressdetails=1&limit=1";

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);

	xhr.onreadystatechange = function () 
	{
		if (xhr.readyState === 4) 
		{
			if (xhr.status === 200)
			{
				try {
					var js = JSON.parse(xhr.responseText);

				} catch(e) {

					console.log("Error: did not receive JSON from nominatim.openstreetmap.org.");
					return false;
				}
				
				var _place = document.getElementById(pid + "_place");
				_place.innerHTML = js.display_name;

			} else {

				console.log("Error: " + xhr.statusText);
			}
		}
	};

	xhr.send();
}

/* -----------------------------------------------------------------------
   function to finally fill in the data into the results list:
   - privilege = "preferred"   -> the preferred geotags in black
   - privilege = "alternative" -> alternative geotags in grey
   - adds copy-buttons for "preferred" only
   ----------------------------------------------------------------------- */
function writeTheGeotags(pid, privilege, theData)
{
	let fix  = document.getElementById(pid + "_fix_" + privilege);
	let link = document.getElementById(pid + "_lnk_" + privilege);
	let name = document.getElementById(pid + "_name").innerText;
	let copy = document.getElementById(pid + "_copy");

	if ( typeof theData != "object" || theData.Day == null || theData.Index == null || fix == null || link == null )
	{
		// received any empty data
		return null;
	}
	
	let lat  = timeline[theData.Day][theData.Index].theLat;
	let lon  = timeline[theData.Day][theData.Index].theLong;

	fix.innerHTML  = "lat: " + String(lat).substring(0,9) + " lon: " + String(lon).substring(0,9) + " (-" + theData.Minutes + "min)";
	link.innerHTML = "<a href='https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lon + "#map=14/" + lat + "/" + lon + "'></a>";

	if ( privilege != "preferred" || copy == null )
	{
		// no other buttons to draw
		return true;
	}

	let latRef      = (lat < 0) ? 'S' : 'N';
	let lonRef      = (lon < 0) ? 'W' : 'E';
	let exiftool    = "exiftool " + name + " -gpslatitude=" + lat + " -gpslongitude=" + lon + " -gpslatituderef=" + latRef + " -gpslongituderef=" + lonRef;
	let coordinates = lat + "," + lon;

	copy.innerHTML = "copy to clipboard: "
			+ "<a href='javascript:;' onClick='copyToClipboard(\"" + exiftool + "\")'>exiftool</a> "
			+ "<a href='javascript:;' onClick='copyToClipboard(\"" + coordinates + "\")'>coordinates</a>";
}

/* -----------------------------------------------------------------------
   Searches through the timeline-array of the given day (imageDate!) for 
   the latest GPS-fixes reported in the array. Calls writeTheGeotags to
   add the information into the results and returns an object to get all
   information about the GPS-fixes:
   - timeline[fit.before.Day][fit.before.Index] -> latest fix before imageDate
   - timeline[fit.after.Day][fit.after.Index] -> latest fix after imageDate
   - fix.before.Minutes, fix.after.Minutes -> time between the fix and imageDate
   ----------------------------------------------------------------------- */
function getTheGeotags(pid, imageDate)
{
	if ( typeof imageDate != "object" || imageDate == null )
	{
		disableRow(pid, "no DateTimeOriginal found in the EXIF-record");
		return null;
	}

	var theDay = imageDate.getFullYear() + '-' + imageDate.getMonth() + '-' + imageDate.getDate();

	if ( typeof timeline[theDay] == "undefined" )
	{
		disableRow(pid, "no GPS-fixes found on this day");
		return null;
	}

	var j;

	for ( j=0 ; j<timeline[theDay].length ; j++ )
	{
		if (timeline[theDay][j].theDate > imageDate) 
		{
			break;
		}
	}

	var fit    = new Object();
	fit.before = new Object();
	fit.after  = new Object();

	fit.before.Day   = theDay;
	fit.before.Index = j-1;
	fit.after.Day    = theDay;
	fit.after.Index  = j;

	if ( j == 0 )
	{	
		let tmpDate  = new Date();
		tmpDate.setDate(tmpDate.getTime() - 24*60*60*1000);
		fit.before.Day = tmpDate.getFullYear() + '-' + tmpDate.getMonth() + '-' + tmpDate.getDate();

		if (typeof timeline[fit.before.Day] != "undefined")
		{
			fit.before.Index = timeline[fit.before.Day].length-1;

		} else {

			fit.before.Day   = null;
			fit.before.Index = null;
		}
	}

	if ( j == timeline[theDay].length )
	{
		let tmpDate  = new Date();
		tmpDate.setTime(imageDate.getTime() + 24*60*60*1000);
		fit.after.Day = tmpDate.getFullYear() + '-' + tmpDate.getMonth() + '-' + tmpDate.getDate();

		if (typeof timeline[fit.after.Day] != "undefined")
		{
			fit.after.Index = 0;

		} else {

			fit.after.Day   = null;
			fit.after.Index = null;
		}
	}

	fit.before.Minutes = 60*24*2;
	fit.after.Minutes  = 60*24*2;

	if ( fit.before.Day != null && fit.before.Index != null )
	{
		fit.before.Minutes = Math.round((imageDate - timeline[fit.before.Day][fit.before.Index].theDate)/1000/60);
	}

	if ( fit.after.Day != null && fit.after.Index != null )
	{
		fit.after.Minutes = Math.round((timeline[fit.after.Day][fit.after.Index].theDate - imageDate)/1000/60);
	}

	if ( fit.before.Minutes < fit.after.Minutes )
	{
		writeTheGeotags(pid, 'preferred', fit.before);
		writeTheGeotags(pid, 'alternative', fit.after);

	} 
	else if ( fit.before.Minutes > fit.after.Minutes )
	{

		writeTheGeotags(pid, 'preferred', fit.after);
		writeTheGeotags(pid, 'alternative', fit.before);
	}

	return fit;
}

/* -----------------------------------------------------------------------
   Helper function to convert to convert GPS-tags already received via
   EXIT into decimal coordinates. Returns a link to OSM.
   ----------------------------------------------------------------------- */
function getDecCoords(lat, latRef, lon, lonRef)
{
	if ( typeof lat != "object" || typeof lon != "object" ) 
	{
		return "not found";
	}

	let coords = new Object();

	coords.lat = Number(lat[0]) + Number(lat[1])/60 + Number(lat[2])/3600;
	coords.lon = Number(lon[0]) + Number(lon[1])/60 + Number(lon[2])/3600;

	coords.lat = latRef == 'S' ? coords.lat * -1 : coords.lat;
	coords.lon = lonRef == 'W' ? coords.lon * -1 : coords.lon;

	coords.link = "https://www.openstreetmap.org/?mlat=" + coords.lat + "&mlon=" + coords.lon + "#map=14/" + coords.lat + "/" + coords.lon;

	return "<a href='" + coords.link + "' target='_blank'></a>";
}

/* -----------------------------------------------------------------------
   Reads the required EXIF-data out of 'exif' and puts it into the elements
   linked by 'pid'. Returns the timestampe when the image was shot.
   ----------------------------------------------------------------------- */
function getExif(pid, exif)
{
	var _date   = document.getElementById(pid + "_date");
	var _geotag = document.getElementById(pid + "_geotag");

	if ( typeof exif != "object" ) 
	{
		_date.innerHTML = "no EXIF";
		disableRow(pid, "no EXIF-data found at all");
		return null;
	}

	let lat    = exif['GPSLatitude'];
	let latRef = exif['GPSLatitudeRef'];
	let lon    = exif['GPSLongitude'];
	let lonRef = exif['GPSLongitudeRef'];
	let dto    = exif['DateTimeOriginal'];

	let imageDate = null;

	if ( typeof dto != "undefined" )
	{
		let b     = dto.split(/\D/);
		imageDate = new Date(b[0],b[1]-1,b[2],b[3],b[4],b[5]);

		_date.innerHTML = imageDate.getFullYear() + '-' 
				+ ("0" + (imageDate.getMonth()+1)).slice(-2) + '-' 
				+ ("0" +  imageDate.getDate()    ).slice(-2) + ' ' 
				+ ("0" +  imageDate.getHours()   ).slice(-2) + ':' 
				+ ("0" +  imageDate.getMinutes() ).slice(-2);

	} else {

		_date.innerHTML = "no date";
		disableRow(pid, "no DateTimeOriginal found in the EXIF-record");
		return null;
	}

	if (	typeof lat    != "undefined" &&
		typeof latRef != "undefined" &&
		typeof lon    != "undefined" &&
		typeof lonRef != "undefined")
	{
		_geotag.innerHTML = getDecCoords(lat, latRef, lon, lonRef);
		_geotag.classList.remove("disabled");

	} else {

		_geotag.innerHTML = "<a></a>";
		_geotag.classList.add('disabled');
	}

	return imageDate;
}

/* -----------------------------------------------------------------------
   triggers when file has been selected
   ----------------------------------------------------------------------- */
function handleImages(fileList)
{
	var pid = [];

	var imgList = document.getElementById("geotagger-js-imagelist");
	imgList.innerHTML = "";

	/* draw the whole results-line to make sure all elements are there */
	for ( let i=0 ; i<fileList.length ; i++ )
	{
		pid[i] = "image" + Math.random().toString(16).slice(2);

		var result = document.createElement('div');
		result.classList.add('result');

		var imageWrapper = document.createElement('div');
		imageWrapper.classList.add('image-wrapper');

		var image = document.createElement('div');
		image.id = pid[i];

		var meta = document.createElement('div');
		meta.classList.add('meta');

		var metaGeotag = document.createElement('span');
		metaGeotag.classList.add('meta-geotag');
		metaGeotag.classList.add('pushpin');
		metaGeotag.classList.add('disabled');
		metaGeotag.id = pid[i] + "_geotag";

		var metaDate = document.createElement('span');
		metaDate.classList.add('meta-date');
		metaDate.id = pid[i] + "_date";

		var dataWrapper = document.createElement('div');
		dataWrapper.classList.add('data-wrapper');

		var filename = document.createElement('h4');
		filename.id = pid[i] + "_name";

		var dataGeotagPreferred = document.createElement('div');
		dataGeotagPreferred.classList.add('data-geotag');

		var dataGeotagPreferredLink = document.createElement('span');
		dataGeotagPreferredLink.classList.add('pushpin');
		dataGeotagPreferredLink.id = pid[i] + "_lnk_preferred";

		var dataGeotagPreferredText = document.createElement('span');
		dataGeotagPreferredText.id = pid[i] + "_fix_preferred";

		var dataGeotagAlternative = document.createElement('div');
		dataGeotagAlternative.classList.add('data-geotag');
		dataGeotagAlternative.classList.add('alternative');

		var dataGeotagAlternativeText = document.createElement('span');
		dataGeotagAlternativeText.id = pid[i] + "_fix_alternative";

		var dataGeotagAlternativeLink = document.createElement('span');
		dataGeotagAlternativeLink.classList.add('pushpin');
		dataGeotagAlternativeLink.id = pid[i] + "_lnk_alternative";

		var dataGeotagCopyToClipboard = document.createElement('div');
		dataGeotagCopyToClipboard.classList.add('data-geotag');
		dataGeotagCopyToClipboard.classList.add('copy');
		dataGeotagCopyToClipboard.id = pid[i] + "_copy";

		imageWrapper.appendChild(image);
		meta.appendChild(metaGeotag);
		meta.appendChild(metaDate);
		imageWrapper.appendChild(meta);
		result.appendChild(imageWrapper);
		dataWrapper.appendChild(filename);
		dataGeotagPreferred.appendChild(dataGeotagPreferredLink);
		dataGeotagPreferred.appendChild(dataGeotagPreferredText);
		dataWrapper.appendChild(dataGeotagPreferred);
		dataGeotagAlternative.appendChild(dataGeotagAlternativeLink);
		dataGeotagAlternative.appendChild(dataGeotagAlternativeText);
		dataWrapper.appendChild(dataGeotagAlternative);
		dataWrapper.appendChild(dataGeotagCopyToClipboard);
		result.appendChild(dataWrapper);
		imgList.appendChild(result);
	}

	
	/* read the file(s) */
	for ( let i=0 ; i<fileList.length ; i++ )
	{
		let fr1 = new FileReader(); 
		let fr2 = new FileReader(); 

		fr1.onload = function (e) 
		{
			image = document.getElementById(pid[i]);
			image.innerHTML = "<img id='" + pid[i] + "' src='" + e.target.result + "'" + "title='" + fileList[i].name + "'/>";

			filename = document.getElementById(pid[i] + '_name');
			filename.innerHTML = fileList[i].name;
		};

		fr2.onload = function (e)
		{
			var exif    = EXIF.readFromBinaryFile(this.result);
			var imgDate = getExif(pid[i], exif);
			if ( imgDate != null ) 
			{
				getTheGeotags(pid[i], imgDate);
			}
		}

		fr1.readAsDataURL(fileList[i]);
		fr2.readAsArrayBuffer(fileList[i]);
	}
}


