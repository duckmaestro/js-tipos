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
 

//////
// js-tipos boostrapper.
//////



if(typeof($tipos) === "undefined")
{
	$tipos = null;
}

if (jstipos_base == null) {
	jstipos_base = "/";
}

(function(){

	var strBasePath = jstipos_base;
	
	var iIncludeCounter = Number.MAX_VALUE;

	// check base path
	if (strBasePath[strBasePath.length - 1] !== "/") {
		throw new Error("Base path must end in a slash.");
	}

	// a simple script includer
	var fnIncludeScript = function (strPath) {
		var nodeScript = document.createElement("script");
		nodeScript.setAttribute("type", "text/javascript");
		nodeScript.setAttribute("src", strPath);
		nodeScript.setAttribute("async", true);
		var head = document.getElementsByTagName("head").item(0);
		head.appendChild(nodeScript);
	};

	// start including things
	fnIncludeScript(strBasePath + "Classer.js");
	var bClasserLoaded = false;

	// onready queue
	var arr_fnOnReady = [];
	
	$tipos = function(fnOnReady)
	{
		if(fnOnReady === "Classer" && !bClasserLoaded)
		{
			bClasserLoaded = true;
			iIncludeCounter = 3;
			fnIncludeScript(strBasePath + "IncludeLoader.js");
			fnIncludeScript(strBasePath + "ObjectLoader.js");
			fnIncludeScript(strBasePath + "Utils.js");
		}
		else if(typeof(fnOnReady) === "function"){
			if(iIncludeCounter>0) {
				arr_fnOnReady.push(fnOnReady);
			}
			else {
				fnOnReady();
			}
		}
		else if(fnOnReady === true)
		{
			// have we finished loading the core code?
			if(iIncludeCounter - 1 === 0)
			{
				--iIncludeCounter;

				var iNumFnOnReady = arr_fnOnReady.length;
				
				// copy into a new array
				var arr_fnOnReadCopy = [];
				
				for(var iFn = 0; iFn < iNumFnOnReady; ++iFn)
				{
					arr_fnOnReadCopy[iFn] = arr_fnOnReady[iFn];
				}
				
				window.setTimeout(function(){ 
					for(var iFn = 0; iFn < arr_fnOnReadCopy.length; ++iFn)
					{
						arr_fnOnReadCopy[iFn]();
					}
				},1);
			}
			else {
				--iIncludeCounter;	
			}
		}
	};

})();

