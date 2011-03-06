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
 
 
 
if (typeof ($tipos) === "undefined") { $tipos = {}; }
$tipos.Classer = {

	/////////////////////
	// CONSTANTS
	/////////////
	CONSTRUCTOR_NAME: "_ctor",
	BASE_CALL_NAME: "base",
	FN_NOT_IMPLEMENTED_ERROR: function () { debugger; throw new Error("Interface method not implemented."); },
	FN_BASE_CALL: function () {
		$assert(arguments != null && arguments.callee != null && arguments.callee.caller != null);

		var fnMethod = arguments.callee.caller;

		var oObjectInstance = this;
		$require_type(fnMethod, "function");
		$require_type_null(fnMethod.__baseMethod, "function");

		var fnBaseMethod = fnMethod.__baseMethod || null;
		if (fnBaseMethod === null) {
			throw new Error("Method has no base class implementation.");
		}

		return fnBaseMethod.apply(
			oObjectInstance,
			arguments
		);
	},
	FN_BASE_CALL_STRICT: function (fnMethod) {
		/// <summary>A JavaScript Strict Mode compatible 
		/// version of FN_BASE_CALL. Requires the overridden method to be 
		/// passed in first. Currently not used.</summary>
		var oObjectInstance = this;
		$require_type(fnMethod, "function");
		$require_type_null(fnMethod.__baseMethod, "function");

		var fnBaseMethod = fnMethod.__baseMethod || null;
		if (fnBaseMethod === null) {
			throw new Error("Method has no base class implementation.");
		}

		return fnBaseMethod.call(
			oObjectInstance,
			arguments[1],
			arguments[2],
			arguments[3],
			arguments[4],
			arguments[5],
			arguments[6],
			arguments[7],
			arguments[8]
		);
	},


	/////////////////////
	// FIELDS
	/////////////
	_arr_oClasses: [], // the primary list of classes via full names.
	_arr_oClassesShortNames: [], // a cache of classes via short names.

	_arr_oObjectsConstructingArgs: [], // stack of the args of the currently constructing object.


	/////////////////////
	// METHODS PUBLIC
	/////////////
	register: function (strClassDeclaration, oPrototype) {
		var This = this;


		// is inheritence involved?
		var arr_strSplit = strClassDeclaration.split(/\s*:\s*/);
		if (arr_strSplit.length > 2) {
			throw new Error("Invalid class declaration.");
		}
		var strClassName = arr_strSplit[0];
		var strBaseClassName = null;
		if (arr_strSplit.length > 1) {
			strBaseClassName = arr_strSplit[1];
		}

		// ensure namespace exists and grab namespace parent
		var oNamespaceNode = this._ensureNamespace(strClassName);

		// grab shortname
		var strShortName = this._getShortClassName(strClassName);

		// grab longname of base class
		//this._findClassUsingShortName(strBaseClassName);


		//////
		// prototype

		// if prototype was given as a function, we need to evaluate it to generate it.
		if (typeof (oPrototype) === "function") {
			oPrototype = oPrototype();
		}

		// store prototype and setup the constructor.
		var oClass = null;
		oClass = this._configureAndStoreClass(strClassName, oPrototype, strBaseClassName);

		// return the class
		return oClass;
	},

	registerInterface: function (strInterfaceName, oPrototype) {

		// create a prototype based on the given
		var oPrototypeCopy = {};
		for (var strKey in oPrototype) {
			//var oValue = oPrototype[strKey];
			oPrototypeCopy[strKey] = this.FN_NOT_IMPLEMENTED_ERROR;
		}

		this.register(strInterfaceName, oPrototypeCopy);
	},

	registerStatic: function (strClassName, staticObject, bCallConstructor) {
		// ensure namespace exists and grab namespace parent
		var namespaceNode = this._ensureNamespace(strClassName);

		// grab shortname
		var shortName = this._getShortClassName(strClassName);

		// store type name
		staticObject.__type = strClassName;

		// store object
		namespaceNode[shortName] = staticObject;

		// call constructor?
		if (bCallConstructor && typeof (staticObject[this.CONSTRUCTOR_NAME]) === "function") {
			staticObject[this.CONSTRUCTOR_NAME]();
		}

		// return the class
		return staticObject;
	},

	instantiate: function (strClassName, oParams) {
		// find class
		var oClass = this._findClassUsingShortName(strClassName);

		// instantiate
		var oObj = new oClass(oParams);

		// done
		return oObj;
	},

	// returns a constant in a class
	constant: function (class_, strConstantName) {
		// grab class
		var klass = null;
		if (typeof (class_) === "object") {
			klass = class_;
		}
		else if (typeof (class_) === "string") {
			klass = this._findClassUsingShortName(class_);
		}

		if (klass == null) {
			throw new Error();
		}

		//////
		// check existance and type
		var strTypeInClass;
		var bIsStatic = false;

		// non-static class?
		if (klass.prototype) {
			klass = klass.prototype;
		}

		// grab value
		var oValue = klass[strConstantName];
		var strTypeOfValue = typeof (oValue);

		// check
		if (strTypeOfValue === "undefined" || strTypeOfValue === "function") {
			throw new Error("Constant '" + strConstantName + "' not found in type '" + klass.__type + "'.");
		}

		// done
		return oValue;
	},

	typeOf: function (oObject) {
		return oObject["__type"] || ((oObject instanceof Array) ? "array" : typeof (oObject));
	},

	isType: function (oObject, strType) {
		if (strType == null) {
			throw new Error("missing type name");
		}

		if (oObject === null) {
			throw new Error("missing object.");
		}

		var strNativeType = typeof (oObject);

		// handle numbers, functions, etc.
		if (strNativeType !== "object") {
			if (strNativeType !== strType) {
				return false;
			}
			else {
				return true;
			}
		}

		// handle generic object if that is what is being tested for.
		if (strType === "object") {
			return true;
		}

		// grab type of object
		var strTypeOfObject = this.typeOf(oObject);

		// check type.
		if (strTypeOfObject === strType) {
			return true;
		}

		// attempt to resolve full name then compare again
		var strTypeFullName = this._findClassUsingShortName(strType).prototype.__type;
		if (strTypeOfObject === strTypeFullName) {
			return true;
		}
		else {
			return false;
		}
	},

	// checks the type and throws an error if type check fails
	requireType: function (oObject, strType, bAllowNull) {
		if (bAllowNull && oObject === null) {
			return;
		}

		if (this.isType(oObject, strType)) {
			return;
		}

		throw new Error("Test for type '" + strType + "' failed.");
	},

	// checks the type of the argument for the current constructor and returns it if the argument exists and is valid.
	checkArgument: function (strArgsFieldName, strType) {
		var args = this._arr_oObjectsConstructingArgs[this._arr_oObjectsConstructingArgs.length - 1];
		var oValue = args[strArgsFieldName];
		if (typeof (oValue) === "undefined" || oValue === null) {
			return null;
		}
		if (strType == null) {
			return oValue;
		}
		$tipos.Classer.requireType(oValue, strType);
		return oValue;
	},


	/////////////////////
	// METHODS PRIVATE
	////////////
	_findClassUsingShortName: function (strShortName) {
		/// <summary>Resolves a class's short name to its long name and returns the class.</summary>

		// search using full name
		klass = this._arr_oClasses[strShortName] || null;

		// if not found using full name
		if (klass === null) {
			// search using short name
			klass = this._arr_oClassesShortNames[strShortName] || null;

			// if not found using short name
			if (klass === null) {

				// search for a full name match using short name and cache the result
				for (var key in this._arr_oClasses) {
					var iLastIndexOfClassNameInKey = key.lastIndexOf(strShortName);
					if (iLastIndexOfClassNameInKey == -1) {
						continue;
					}

					if (iLastIndexOfClassNameInKey + strShortName.length == key.length
						&& (iLastIndexOfClassNameInKey === 0 || key[iLastIndexOfClassNameInKey - 1] === '.')) {
						klass = this._arr_oClasses[key];
						this._arr_oClassesShortNames[strShortName] = klass;
						break;
					}
				}
			}
		}

		if (klass === null) {
			throw new Error("Unknown class \"" + strShortName + "\".");
		}

		return klass;
	},

	_ensureNamespace: function (className, bIsOnlyNamespace) {
		/// <summary>Ensures given the class name that 
		/// it's namespace is created. Returns the deepest 
		/// namespace node.</summary>

		$require_type(className, "string");
		if (typeof (bIsOnlyNamespace) === "undefined") {
			bIsOnlyNamespace = false;
		}

		var splitted = className.split('.');

		var parent = window;
		var iLimit = splitted.length - (bIsOnlyNamespace ? 0 : 1);
		for (var i = 0; i < iLimit; ++i) {
			var nodeName = splitted[i];
			if (typeof (parent[nodeName]) === 'undefined') {
				parent[nodeName] = {};
			}
			parent = parent[nodeName];
		}
		return parent;
	},

	_getShortClassName: function (className) {
		/// <summary>Given the full name of a class, returns its short name.</summary>

		var splitted = className.split('.');
		return splitted[splitted.length - 1];
	},

	_configureAndStoreClass: function (strClassName, oPrototype, strBaseClassName) {
		/// <summary>Given a class's name and prototype, initializes and
		/// stores the prototype within the Classer system.
		/// Returns the new class.</summary>

		var This = this;

		// store prototype and setup the constructor.
		var oClass = null;

		// ensure namespace exists and grab namespace parent
		var oNamespaceNode = this._ensureNamespace(strClassName);

		// grab shortname
		var strShortName = this._getShortClassName(strClassName);


		// does this class depend on a base type?
		var arr_fnConstructorChain = [];
		if (strBaseClassName) {
			// add the derived class constructor
			if (typeof (oPrototype[This.CONSTRUCTOR_NAME]) === "function") {
				arr_fnConstructorChain.push(oPrototype[This.CONSTRUCTOR_NAME]);
			}

			// merge prototype with its base type
			oPrototype = this._mergePrototypes(oPrototype, strBaseClassName);

			// gather base type constructors
			var oPrototypeTmp = this._findClassUsingShortName(strBaseClassName);
			while (true) {
				if (typeof (oPrototypeTmp.prototype[This.CONSTRUCTOR_NAME]) === "function") {
					arr_fnConstructorChain.push(oPrototypeTmp.prototype[This.CONSTRUCTOR_NAME]);
				}
				if (oPrototypeTmp.prototype.__baseType) {
					oPrototypeTmp = this._findClassUsingShortName(oPrototypeTmp.prototype.__baseType);
				}
				else {
					break;
				}
			}
		}
		else {
			if (typeof (oPrototype[This.CONSTRUCTOR_NAME]) === "function") {
				arr_fnConstructorChain.push(oPrototype[This.CONSTRUCTOR_NAME]);
			}
		}

		// prepare prototype constructor
		if (arr_fnConstructorChain.length !== 0) {
			oClass = function (args) {
				args = args || {};

				This._arr_oObjectsConstructingArgs.push(args);

				for (var z = arr_fnConstructorChain.length - 1; z >= 0; --z) {
					arr_fnConstructorChain[z].call(this, args);
				}

				This._arr_oObjectsConstructingArgs.pop();
			};
		}
		else {
			oClass = function () { };
		}

		// add "base method call" method.
		oPrototype[this.BASE_CALL_NAME] = this.FN_BASE_CALL;

		// bind prototype to constructor
		oClass.prototype = oPrototype;

		// prepare meta info
		oClass.prototype.__type = strClassName;
		if (strBaseClassName) {
			oClass.prototype.__baseType = strBaseClassName;
			oClass.prototype.__base = this._findClassUsingShortName(strBaseClassName).prototype;
		}

		// store in internal structure
		this._arr_oClasses[strClassName] = oClass;

		// store publically so that "new"-style instantiations work as normal.
		oNamespaceNode[strShortName] = oClass;

		return oClass;
	},

	_mergePrototypes: function (oDerivedClassPrototype, strBaseClassName) {
		/// <summary>Given a prototype and the name of a base prototype,
		/// creates a new prototype by merging the child and base prototypes.</summary>

		// locate the base class
		var oBasePrototype = this._findClassUsingShortName(strBaseClassName).prototype;

		// build our prototype
		var oPrototype2 = {};

		// copy from base class prototype
		for (var strKey in oBasePrototype) {
			if (!oBasePrototype.hasOwnProperty(strKey)) {
				continue;
			}

			if (strKey === this.CONSTRUCTOR_NAME
				&& strKey === this.BASE_CALL_NAME) {
				continue;
			}

			oPrototype2[strKey] = oBasePrototype[strKey];
		}

		// copy from new prototype
		for (var strKey in oDerivedClassPrototype) {
			if (!oDerivedClassPrototype.hasOwnProperty(strKey)) {
				continue;
			}

			// does the destination key exist already and is it a function?
			var fnBaseMethod;
			if (oPrototype2.hasOwnProperty(strKey)
				&& strKey !== this.CONSTRUCTOR_NAME
				&& strKey !== this.BASE_CALL_NAME
				&& (typeof (fnBaseMethod = oPrototype2[strKey])) === "function"
				&& fnBaseMethod !== this.FN_NOT_IMPLEMENTED_ERROR
			) {
				// store the base method as a property of the new method
				// (stored during the if-statement.)
			}
			else {
				fnBaseMethod = null;
			}

			oPrototype2[strKey] = oDerivedClassPrototype[strKey];
			if (fnBaseMethod !== null) {
				oPrototype2[strKey].__baseMethod = fnBaseMethod;
			}
		}

		return oPrototype2;
	}
};


/////////////////////
// METHODS SHORTCUTS
/////////////

// declares a namespace
$namespace = function (strNameSpace) { $tipos.Classer._ensureNamespace(strNameSpace, true); };

// declares a class
$class = function(fullName, prototypee) { $tipos.Classer.register(fullName, prototypee); };

// declares an interface
$interface = function(strName, oPrototype) { $tipos.Classer.registerInterface(strName, oPrototype); };

// declares a static class
$class_static = function(fullName, staticObject, bCallConstructor) { $tipos.Classer.registerStatic(fullName, staticObject, bCallConstructor || true); };

// returns the type of the object
$typeof = function(oObject) { return $tipos.Classer.typeOf(oObject); }

// enforces type or throws error
$require_type = function(oObject, strType) { $tipos.Classer.requireType(oObject, strType, false); }

// enforces type or throws error. allows null.
$require_type_null = function(oObject, strType) { $tipos.Classer.requireType(oObject, strType, true); }

// retrieve a constant
$constant = function (klass, strConstantName) { $tipos.Classer.constant(klass, strConstantName); };

// checks an incoming argument. returns it if valid.
$argument = function (strArgsFieldName, strType) { return $tipos.Classer.checkArgument(strArgsFieldName, strType); };

// notify bootstrapper that we're ready.
$tipos("Classer");