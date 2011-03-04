/*******************************************************************
 *     js-tipos
 *******************************************************************
  Copyright 2010-2011 Clifford Champion.
  
  This file is part of js-tipos.
  
  js-tipos is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  js-tipos is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  You should have received a copy of the GNU General Public License
  along with js-tipos.  If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************/
 

/// <reference path="~/Base/Classer.js" />

$class(
"$tipos.LoaderItemRecord",
{
	/////////////////////
	// CONSTANTS
	/////////////
	BYPASS_CACHE: true,


	/////////////////////
	// FIELDS
	/////////////
	_strType: null, // "image", "script", ...
	_strPath: null,
	_bIsLoaded: false,
	_arr_fnOnLoaded: null,

	_oImgNode: null,
	_oDeserializedObject: null,


	/////////////////////
	// CONSTRUCTOR
	/////////////
	_ctor: function (params) {
		var This = this;

		// grab params
		this._strPath = params["strPath"];
		this._arr_fnOnLoaded = [];
		this._bIsLoaded = false;

		// grab type
		var strType;
		if (typeof (params["strType"]) === "string") {
			strType = params["strType"];
		}
		else if (typeof (params["strType"]) === "undefined" || params["strType"] === null) {
			strType = "auto";
		}
		else {
			throw new Error("Invalid type.");
		}

		// check type
		if (strType === "auto") {
			if (this._strPath.indexOf(".js") !== -1) {
				strType = "script";
			}
			else if (this._strPath.indexOf(".png") !== -1
					|| this._strPath.indexOf(".jpg") !== -1
					|| this._strPath.indexOf(".gif") !== -1) {
				strType = "image";
			}
			else if (this._strPath.indexOf(".obj.txt") !== -1) {
				strType = "object";
			}
			else {
				throw new Error("Unknown type.");
			}
		}
		else if (strType === "script") {

		}
		else if (strType === "image") {

		}
		else {
			throw new Error("Unknown type.");
		}
		this._strType = strType;


		// attach listener
		if (typeof (params["onLoaded"]) === "function") {
			this._arr_fnOnLoaded.push(params["onLoaded"]);
		}
		else if (params["onLoaded"] !== null && typeof (params["onLoaded"]) !== "undefined") {
			throw new Error("Unknown callback type.");
		}


		//////
		// initiate loading

		var strBypassCacheSuffix = "";
		if (This.BYPASS_CACHE) {
			strBypassCacheSuffix = "?" + Math.round(100000 * Math.random()).toString();
		}

		//////
		// image
		if (strType === "image") {

			// load the image
			window.setTimeout(function () {
				var oImg = document.createElement("img");
				oImg.setAttribute("src", This._strPath + (This.BYPASS_CACHE ? strBypassCacheSuffix : ""));
				var style = "position:absolute; left:-10000px; top:-10000px;";
				oImg.setAttribute("style", style);
				oImg.setAttribute("alt", "image asset");
				document.getElementsByTagName("body").item(0).appendChild(oImg);

				This._oImgNode = oImg;

				// set a timer to check for image load
				var oIntervalHandle = null;
				var fnCheckImageLoaded = function () {
					if (oImg.width > 0
						&& oImg.height > 0
						&& (typeof (oImg.complete) === "undefined") || (typeof (oImg.complete) !== "undefined" && oImg.complete)) {
						This.notifyIsLoaded();
						window.clearInterval(oIntervalHandle);
						oIntervalHandle = null;
					}
				};
				oIntervalHandle = window.setInterval(fnCheckImageLoaded, 250);
			}, 1);
		}

		//////
		// script
		else if (strType === "script") {
			var nodeScript = document.createElement("script");
			nodeScript.setAttribute("type", "text/javascript");
			nodeScript.setAttribute("src", this._strPath + (this.BYPASS_CACHE ? strBypassCacheSuffix : ""));
			nodeScript.setAttribute("async", true);

			var head = document.getElementsByTagName("head").item(0);
			head.appendChild(nodeScript);
		}

		//////
		// object data
		else if (strType === "object") {
			// fire up an ajax request
			var ajaxObject;

			try {
				ajaxObject = new XMLHttpRequest();
			}
			catch (e) {
				throw new Error("Native AJAX not supported in the current browser.");
			}

			ajaxObject.open("GET", this._strPath + (This.BYPASS_CACHE ? strBypassCacheSuffix : ""), true);
			ajaxObject.setRequestHeader("Content-Type", "text/plain");
			ajaxObject.onreadystatechange = function () {
				if (ajaxObject.readyState == 4) {
					if (ajaxObject.status != 200) {
						throw new Error("Error loading text data through ajax. Response " + ajaxObject.status + ".");
					}

					// grab text
					var strResponseText = ajaxObject.responseText;

					// deserialize
					var oRootObject = $tipos.ObjectLoader.deserialize(strResponseText);

					// store object
					This._oDeserializedObject = oRootObject;

					// signal
					This.notifyIsLoaded();
				}
			};
			ajaxObject.send(null);
		}
	},


	/////////////////////
	// METHODS
	/////////////
	attachListener: function (fn) {
		if (typeof (fn) !== "function") {
			throw new Error("Invalid parameter. expected a function.");
		}

		if (this._bIsLoaded) {
			if (this._strType === "image") {
				fn(this._oImgNode);
			}
			else {
				fn();
			}
			return;
		}

		this._arr_fnOnLoaded.push(fn);
	},

	notifyIsLoaded: function (fnOptionalOverrideCallback) {


		// mark as loaded
		this._bIsLoaded = true;

		// sanity check
		if (this._strType === "image") {
			if (this._oImgNode == null) {
				throw new Error("Expected non-null oImgNode be already set.");
			}
		}
		else if (this._strType === "object") {
			if (this._oDeserializedObject == null) {
				throw new Error("Expected object data loaded.");
			}
		}

		// notify listeners
		var arr_fnListenersToUse;
		if (fnOptionalOverrideCallback) {
			arr_fnListenersToUse = [fnOptionalOverrideCallback];
		}
		else {
			arr_fnListenersToUse = this._arr_fnOnLoaded;
		}

		for (var j = 0; j < arr_fnListenersToUse.length; ++j) {
			if (this._strType === "image") {
				arr_fnListenersToUse[j](this._oImgNode);
			}
			else if (this._strType === "object") {
				arr_fnListenersToUse[j](this._oDeserializedObject);
			}
			else {
				arr_fnListenersToUse[j]();
			}
		}


		// free the array
		this._arr_fnOnLoaded = null;
	},

	getIsLoaded: function () {
		return this._bIsLoaded;
	},

	getPath: function () {
		return this._strPath;
	},

	getType: function () {
		return this._strType;
	}
});

$class(
"$tipos.LoaderMultiItemWaitRecord",
{

	/////////////////////
	// FIELDS
	/////////////
	array_waitingFor: null,
	fnOnLoaded: null,
	
	_bHasFired: false,


	/////////////////////
	// CONSTRUCTOR
	/////////////
	_ctor: function(params) {
		// init member array
		this.array_waitingFor = [];

		// grab incoming params
		var scriptPaths = params["scriptPaths"];
		var onLoaded = params["onLoaded"];

		// if incoming param is an array
		if (typeof (scriptPaths) === "object"
		&& typeof (scriptPaths.length) !== "undefined") {
			for (var i = 0; i < scriptPaths.length; ++i) {
				this.array_waitingFor.push(
					{
						strPath: scriptPaths[i],
						bIsLoaded: false
					}
				);
			}
		}
		// if incoming param is just a string
		else if (typeof (scriptPaths) === "string") {
			this.array_waitingFor.push(
				{
					strPath: scriptPaths,
					bIsLoaded: false
				}
			);
		}

		// if callback was given
		if (typeof (onLoaded) === "function") {
			this.fnOnLoaded = onLoaded;
		}
	},


	/////////////////////
	// METHODS
	/////////////
	notify: function(partialPath) {
		// find the script
		for (var i = 0; i < this.array_waitingFor.length; ++i) {
			var oTmpRecord = this.array_waitingFor[i];
			var strTmpPath = oTmpRecord.strPath;

			if (strTmpPath.substr(strTmpPath.length - partialPath.length) !== partialPath) {
				continue; // no match, continue
			}

			// match found. mark it as loaded
			oTmpRecord.bIsLoaded = true;
			break;
		}

		// are all desired scripts for this record loaded?
		for (var i = 0; i < this.array_waitingFor.length; ++i) {
			if (!this.array_waitingFor[i].bIsLoaded) {
				return;
			}
		}

		// all scripts passed test. fire callback.
		if (this.fnOnLoaded && !this._bHasFired) {
			this.fnOnLoaded();
			this._bHasFired = true;
		}
	}
});

$class_static(
"$tipos.Loader",
{
	/////////////////////
	// CONSTANTS
	/////////////


	/////////////////////
	// FIELDS
	/////////////
	_arr_records: [],
	_strBasePath: "/",


	/////////////////////
	// CONSTRUCTOR
	/////////////
	_ctor: function(params) {
		if (typeof (js_tipos_base) === "string" && js_tipos_base.length > 0) {
			this._strBasePath = js_tipos_base;
		}
	},


	/////////////////////
	// METHODS PUBLIC: simple loaders
	/////////////
	load: function(strPath, fnOnLoaded) {
		strPath = this._expandPath(strPath);

		//////
		// is item already loaded?
		for (var i = 0; i < this._arr_records.length; ++i) {

			// grab reference
			var oTmpRecord = this._arr_records[i];

			// compare paths
			if (oTmpRecord.getPath() !== strPath) {
				continue;
			}

			// found.

			// is it loaded already?
			if (oTmpRecord.getIsLoaded()) {

				// script is loaded. call callback now.
				if (typeof (fnOnLoaded) === "function") {
					oTmpRecord.notifyIsLoaded(fnOnLoaded);
					return;
				}
			}
			// not loaded already
			else {

				// script is not loaded but is already queued. add this callback to the script's callback list.
				if (typeof (fnOnLoaded) === "function") {
					oTmpRecord.attachListener(fnOnLoaded);
				}

				// done for now. listener will fire later.
				return;
			}
		}

		//////
		// script is not registered or loaded yet. let's begin.
		var oRecord = new $tipos.LoaderItemRecord(
		{
			strPath: strPath,
			onLoaded: fnOnLoaded
		});

		// add a record of the item
		this._arr_records.push(oRecord);
	},

	notifyScriptLoad: function(partialPath) {
		var This = this;

		// find the script
		for (var i = 0; i < This._arr_records.length; ++i) {

			// grab reference
			var oTmpRecord = This._arr_records[i];

			// we want to inspect scripts only
			if (oTmpRecord.getType() !== "script") {
				continue;
			}

			// grab path
			var strTmpPath = oTmpRecord.getPath();

			// compare
			if (strTmpPath.substr(strTmpPath.length - partialPath.length) !== partialPath) {
				continue; // no match, continue
			}

			// we have match. notify.
			oTmpRecord.notifyIsLoaded();
			break;
		}
	},


	/////////////////////
	// METHODS PUBLIC: complex loaders
	/////////////

	/// a higher level method for declaring and loading from a list of script includes.
	include: function(arr_strPaths, fnOnLoaded) {
		var This = this;


		// verify data and convert paths
		var arr_strPathsExpanded = [];
		for (var i = 0; i < arr_strPaths.length; ++i) {
			if (arr_strPaths[i] == null || arr_strPaths[i] === "") {
				throw new Error("Invalid script path.");
			}

			arr_strPathsExpanded[i] = this._expandPath(arr_strPaths[i]);
		}


		// prepare new waitfor record
		var record = new $tipos.LoaderMultiItemWaitRecord(
		{
			scriptPaths: arr_strPathsExpanded,
			onLoaded: fnOnLoaded
		});

		// step through each required scripted and bind the callback to the record
		for (var i = 0; i < arr_strPathsExpanded.length; ++i) {
			(function(i) {
				var tmp = arr_strPathsExpanded[i];
				This.load(
					tmp,
					function() {
						record.notify(tmp);
					}
				);
			})(i);
		}
	},


	/////////////////////
	// METHODS PRIVATE
	/////////////
	_expandPath: function(strPath) {
		if (strPath[0] !== "/" && strPath[0] !== ".") {
			strPath = this._strBasePath + strPath;
		}

		return strPath;
	}
});


/////////////////////
// METHODS SHORTCUTS
/////////////
$load = function(strPath, fnOnLoaded) { $tipos.Loader.load(strPath, fnOnLoaded); }; // to request a resource such as an image
$include = function(scripts, onLoaded) { $tipos.Loader.include(scripts, onLoaded); }; // to reference a set of scripts
$include_notify = function(scriptName) { $tipos.Loader.notifyScriptLoad(scriptName); }; // for a script to notify the loader that it has finished loading


//////
// notify bootstrapper that we're ready.
$tipos(true);