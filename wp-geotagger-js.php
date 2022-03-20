<?php

function shortcode_geotagger_js($params = array())
{
	// PARAMS to the shortcode: field
	extract(shortcode_atts(array(
				'master_class' => 'geotagger-js'
	), $params));

	$val  = '';
	$val .= '<script type="text/javascript" src="' . get_stylesheet_directory_uri() . '/assets/exif.js"></script>';
	$val .= '<script type="text/javascript" src="' . get_stylesheet_directory_uri() . '/assets/geotagger.js"></script>';
	$val .= '<style type="text/css"> @import url("' . get_stylesheet_directory_uri() . '/assets/geotagger-js.css"); </style>';

	$val .= '<div class="' . $master_class . '">';

	ob_start();
	?>
		<div id="geotagger-js-waypoints">
			<div class="geotagger-js-dragdrop" id="geotagger-js-dragdrop-waypoints">
				<span class="desc">
					<span class="step" data-number="1"></span>
					Visit <a href="https://takeout.google.com/settings/takeout/custom/location_history" target="_blank">Google Takeout</a> to download your location-history at Google. Afterwards you may drag&amp;drop the .json-files you received here, or ...
				</span>
				<label class="file">
					<input type="file" multiple="multiple" onchange="handleJSON(this.files)" />
					select your files here
				</label>
			</div>
			<script type="text/javascript"> addDropArea('geotagger-js-dragdrop-waypoints', handleJSON); </script>
			<div id="geotagger-js-statistics">
				<canvas id="geotagger-js-statistics-canvas" width="1232" height="200"></canvas>
				<div>
					<span>
						<span class="title">from:</span>
						<span class="value" id="geotagger-js-statistics-from"></span>
					</span>
					<span>
						<span class="title">to:</span>
						<span class="value" id="geotagger-js-statistics-to"></span>
					</span>
					<span>
						<span class="title">days with data:</span>
						<span class="value" id="geotagger-js-statistics-days"></span>
					</span>
					<span>
						<span class="title">waypoints:</span>
						<span class="value" id="geotagger-js-statistics-waypoints"></span>
					</span>
				</div>
			</div>
		</div>

		<div id="geotagger-js-images" class="disabled">
			<div class="geotagger-js-dragdrop" id="geotagger-js-dragdrop-images">
				<span class="desc">
					<span class="step" data-number="2"></span>
					Drag&amp;drop the images you want to geotag here, or ...
				</span>
				<label class="file">
					<input type="file" multiple="multiple" onchange="handleImages(this.files)" />
					select your images here
				</label>
			</div>
			<script type="text/javascript">	addDropArea('geotagger-js-dragdrop-images', handleImages); </script>
		</div>

		<div id="geotagger-js-imagelist">
		</div>

	</div>
	<?php
	$val .= ob_get_clean();

	return $val;
}

add_shortcode('geotagger_js', 'shortcode_geotagger_js');
