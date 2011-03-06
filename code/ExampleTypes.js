
$interface(
"ExampleNamespace.IVehicle",
{
	// methods
	addFuel: function(amount) { },
	startEngine: function() { },
	stopEngine: function() { }
});


$class(
"ExampleNamespace.Engine",
{
    // fields
    _rpm: null,
    _temperature: null,

    // constructor
    _ctor: function() {
        this._rpm = $argument("rpm", "number") || 0.0;
        this._temperature = $argument("temperature", "number") || 0.0;
    },
	
	// methods
	setRpm: function(rpm)
	{
		this._rpm = $require_type(rpm, "number");
	},
});

$class(
"ExampleNamespace.Car : ExampleNamespace.IVehicle",
{
	// fields
    _speed: null,
    _color: null,
    _gas: null,
    _engine: null,

    // constructor
    _ctor: function() {
        this._speed = 0.0;
        this._color = $argument("color", "string") || "red";
        this._gas = $argument("gas", "number") || 0.0;
        this._engine = new ExampleNamespace.Engine({ temperature: 78.00 });
    },

    // IVehicle methods
    addFuel: function(amount) {
        // if not implemented an exception is thrown immediately during $class().
    },

    startEngine: function() { 
        // if not implemented an exception is thrown immediately during $class().
    },

    stopEngine: function() { 
        // if not implemented an exception is thrown immediately during $class().
    },
	
	toString: function()
	{
		return "This is a " + this._color + " car.";
	}
});


$include_notify("ExampleTypes.js");