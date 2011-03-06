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

$class_static(
"$tipos.ObjectLoader",
{
	/////////////////////
	// CONSTANTS
	/////////////
	DEFAULT_COLLECTION_NAME: "_arr_oChildren",
	REGEX_SINGLE_CHARACTER_TOKEN: /[:{},]/,
	REGEX_WHITE_SPACE: /\s/,
	REGEX_IS_COLLECTION_NAME: /^\[/,


	/////////////////////
	// CONSTRUCTORS
	/////////////
	_ctor: function() {

	},


	/////////////////////
	// METHODS
	/////////////

	/// returns the root object of the deserialized data.
	deserialize: function(strData) {

		// prepare variables
		var oRootContainer = {};
		var arr_oContainerStack = [];
		var arr_strContainerSaveAsStack = [];
		var iPosition;
		var iDataLength = strData.length;

		// reset parser
		arr_oContainerStack.push(oRootContainer);
		iPosition = 0;

		// parse
		while (true) {

			// are we done?
			if (arr_oContainerStack.length === 0) {
				break;
			}
			if (iPosition >= iDataLength) {
				break;
			}

			var oNextToken = null;


			// grab ref to current container
			var oCurrentContainer = arr_oContainerStack[arr_oContainerStack.length - 1];
			var strTypeContainerFor = oCurrentContainer.__strForType || null;

			// grab next token, should be variable name
			oNextToken = this._findNextToken(strData, iPosition);
			if (oNextToken === null) {
				// no more tokens.
				break;
			}
			var strName = strData.substr(oNextToken.iPosition, oNextToken.iLength);

			// if its actually end of scope
			if (strName === "}") {

				// move back up one container
				var oContainer = arr_oContainerStack.pop();
				oCurrentContainer = arr_oContainerStack[arr_oContainerStack.length - 1];
				iPosition = oNextToken.iPosition + 1;
				var strContainerKey = arr_strContainerSaveAsStack.pop();
				var oNewObject = null;

				// container was for specific type?
				if (oContainer.__strForType) {
					oNewObject = $tipos.Classer.instantiate(oContainer.__strForType, oContainer);
				}
				// container was for anonymous type?
				else {
					oNewObject = oContainer;
				}

				// add values that were stored in the default collection
				var arr_oDefaultCollection = null;
				if (arr_oDefaultCollection = oContainer[this.DEFAULT_COLLECTION_NAME]) {
					if (oNewObject.add) {
						for (var iCE = 0; iCE < arr_oDefaultCollection.length; ++iCE) {
							oNewObject.add(arr_oDefaultCollection[iCE]);
						}
					}
					else {
						oNewObject[this.DEFAULT_COLLECTION_NAME] = arr_oDefaultCollection;
					}
				}

				// store value to default member array if array syntax...
				if (!this._storeToArray(oCurrentContainer, strContainerKey, oNewObject)) {
					// ...otherwise store value via property name
					oCurrentContainer[strContainerKey] = oNewObject;
				}

				continue;
			}
			// if tis actually a comma
			else if (strName === ",") {
				iPosition = oNextToken.iPosition + 1;
				continue;
			}
			// if its actually a comment
			else if (strName.search(/^\/{2}/) === 0) {
				iPosition = oNextToken.iPosition + 1;
				while (iPosition < iDataLength) {
					if (strData[iPosition] === '\n') {
						break;
					}
					++iPosition;
				}
				continue;
			}

			// its actually a name. advance.
			iPosition = oNextToken.iPosition + oNextToken.iLength;

			// grab next token, should be a colon
			oNextToken = this._findNextToken(strData, iPosition);
			var strColon = strData.substr(oNextToken.iPosition, oNextToken.iLength);
			if (strColon !== ":") {
				throw new Error("Expected colon.");
			}
			iPosition = oNextToken.iPosition + oNextToken.iLength;

			// grab next token, should be either a type or a value
			oNextToken = this._findNextToken(strData, iPosition);
			var strValueOrType = strData.substr(oNextToken.iPosition, oNextToken.iLength);


			//////
			// grab the value for this key
			var oValue = { "__null": 1 };
			var strValueType = null; // javascript typeof
			var strValueTypeSpecific = null; // classer type or null.

			//////
			// if number
			if (strValueOrType.search(/^-?\d/) === 0) {
				oValue = parseFloat(strValueOrType);
				strValueType = "number";
				iPosition = oNextToken.iPosition + oNextToken.iLength;
			}
			//////
			// if boolean
			else if (strValueOrType.search(/(true)|(false)/) === 0) {
				if (strValueOrType === "true") {
					oValue = true;
				}
				else if (strValueOrType) {
					oValue = false;
				}
				strValueType = "boolean";
				iPosition = oNextToken.iPosition + oNextToken.iLength;
			}
			//////
			// if symbol for local constant. ##
			else if (strValueOrType.search(/^##/) === 0) {
				var strConstantName = strValueOrType.substr(2);
				oValue = $tipos.Classer.constant(strTypeContainerFor, strConstantName);
				strValueType = typeof (oValue);
				iPosition = oNextToken.iPosition + oNextToken.iLength;
			}
			//////
			// if string
			else if (strValueOrType.search(/^"/) === 0) {
				// parse whole string
				var oStringParseResult = this._parseQuotedString(strData, oNextToken.iPosition);

				oValue = oStringParseResult.strString;
				strValueType = "string";
				iPosition = oStringParseResult.iEndOfQuotedString + 1;
			}
			//////
			// if anonymous type
			else if (strValueOrType.search(/^\{/) === 0) {
				var oNewObject = {};
				oValue = oNewObject
				strValueType = "object";
				arr_oContainerStack.push(oNewObject)
				arr_strContainerSaveAsStack.push(strName);
				iPosition = oNextToken.iPosition + 1;
				continue; // dig deeper before we store value. will store after coming back to this level.
			}
			//////
			// if named type
			else {
				iPosition = oNextToken.iPosition + oNextToken.iLength;
				oNextToken = this._findNextToken(strData, iPosition);
				var strNextToken = strData.substr(oNextToken.iPosition, oNextToken.iLength);
				var bHasChildrenSpecified = false;
				if (strNextToken === "{") {
					bHasChildrenSpecified = true;
				}

				strValueType = "object";

				if (bHasChildrenSpecified) {
					oValue = { "__strForType": strValueOrType };
					arr_oContainerStack.push(oValue);
					arr_strContainerSaveAsStack.push(strName);
					iPosition = oNextToken.iPosition + oNextToken.iLength;
					continue; // dig deeper before we store value. will store after coming back to this level.
				}
				else {
					oValue = $tipos.Classer.instantiate(strValueOrType, null);
					iPosition = oNextToken.iPosition;
				}
			}


			//////
			// store value now.

			// check value
			if (oValue["__null"]) {
				throw new Error("Could not load value for '" + strName + "'.");
			}

			// store value to default member array if array syntax...
			if (!this._storeToArray(oCurrentContainer, strName, oValue)) {
				// ...otherwise store value via property name
				oCurrentContainer[strName] = oValue;
			}

			// keep going
			continue;
		}


		// does root contain just a single item? if so, unwrap the inner item.
		var strSingleKey = null;
		var bIsSingle = true;
		for (var key in oRootContainer) {
			if (strSingleKey !== null) {
				bIsSingle = false;
				break;
			}
			strSingleKey = key;
		}

		if (bIsSingle) {
			return oRootContainer[strSingleKey];
		}
		else {
			return oRootContainer;
		}
	},


	/////////////////////
	// METHODS PRIVATE
	/////////////

	// stores into a child array or returns false if strArrayName is not the syntax for array storage.
	_storeToArray: function(oContainer, strArrayName, oValue) {
		if (strArrayName == null) {
			return false;
		}

		if (strArrayName.search(this.REGEX_IS_COLLECTION_NAME) !== 0) {
			return false;
		}

		if (strArrayName === "[]") {
			strArrayName = this.DEFAULT_COLLECTION_NAME;
		}
		else {
			throw new Error("Custom array names not supported yet.");
		}

		var strTypeOfCurrentProp = typeof (oContainer[strArrayName]);
		if (strTypeOfCurrentProp === "undefined" || oContainer[strArrayName] === null) {
			oContainer[strArrayName] = [];
		}
		else if (strTypeOfCurrentProp !== "object") {
			throw new Error("Default collection name exists but with a non-array type.");
		}

		oContainer[strArrayName].push(oValue);

		return true;
	},

	_findNextToken: function(strData, iCurrentPosition) {

		// check for single character tokens
		var rxSingleCharacterTokens = this.REGEX_SINGLE_CHARACTER_TOKEN;
		var rxWhiteSpace = this.REGEX_WHITE_SPACE;

		// check for multi character tokens
		var iStart = -1;
		var i = -1;
		for (i = iCurrentPosition; i < strData.length; ++i) {

			var strCurrentCharacter = strData[i];

			if (iStart === -1) {
				if (rxSingleCharacterTokens.test(strCurrentCharacter)) {
					return { iPosition: i, iLength: 1 };
				}
				else if (rxWhiteSpace.test(strCurrentCharacter)) {
					continue;
				}
				else {
					iStart = i;
					continue;
				}
			}
			else {
				if (rxWhiteSpace.test(strCurrentCharacter)
					|| rxSingleCharacterTokens.test(strCurrentCharacter)) {
					return { iPosition: iStart, iLength: i - iStart };
				}
			}
		}

		if (iStart === -1) {
			return null;
		}
		else {
			return { iPosition: iStart, iLength: i - iStart };
		}
	},

	_parseQuotedString: function(strData, iStartOfQuotedString) {
		var iLengthOfData = strData.length;
		var i = iStartOfQuotedString + 1;
		var bFound = false;
		while (i < iLengthOfData) {

			// end of string?
			if (strData[i] == '"') {
				bFound = true;
				break;
			}

			// start of escape sequence?
			if (strData[i] == '\\') {

				// no room for escape code?
				if (i + 1 >= iLengthOfData) {
					break;
				}

				// if valid escape code
				var strEscapeCodeChar = strData[i + 1];
				if (strEscapeCodeChar === '"') {
					i = i + 2;
					continue;
				}
			}

			++i;
			continue;
		}

		if (!bFound) {
			throw new Error("End of string not found.");
		}

		var iStart = iStartOfQuotedString + 1;
		var iLength = i - iStart;
		return {
			strString: strData.substr(iStartOfQuotedString + 1, iLength),
			iEndOfQuotedString: i
		};
	}
});


//////
// notify bootstrapper that we're ready.
$tipos(true);