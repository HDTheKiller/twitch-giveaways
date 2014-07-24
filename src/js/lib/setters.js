var dot = require('dot');
var emitter = require('emitter');

/**
 * Creates a setters dispatcher for a specific object.
 *
 * Also supports deep property setting via dot notation, e.g. `foo.bar`.
 *
 * Usage:
 *   var obj = { foo: 42, bar: { baz: 'Hello' } };
 *   var setter = setters(obj);
 *   var foo = setter('foo');
 *   var barBaz = setter('bar.baz');
 *   foo(55);
 *   foo() === 55;   // true
 *   obj.foo === 55; // true
 *   barBaz('Hi');
 *   barBaz() === 'Hi';    // true
 *   obj.bar.baz === 'Hi'; // true
 *
 * Make setter use custom value when called:
 *   var obj = { foo: 'Sup' };
 *   var setter = setters(obj);
 *   var fooToHi = setter('foo').to('Hi');
 *   obj.foo === 'Sup'; // true
 *   fooToHi(); // can only be used for setting, not retrieving
 *   obj.foo === 'Hi'; // true
 *   fooToHi('Hello'); // arguments are ignored
 *   obj.foo === 'Hi'; // true
 *
 * Wrap setter with a type casting function:
 *   var obj = { foo: 'totallyNotBoolean' };
 *   var setter = setters(obj);
 *   var foo = setter('foo').type('boolean');
 *   foo() === true; // true
 *   foo(0);
 *   foo() === false; // true
 *
 * Available types casts: string, number, integer, float, boolean
 *
 * Dispatcher also emits event for every property change:
 *   var obj = { foo: 'Sup', bar: { baz: 'Nuffin' } };
 *   var setter = setters(obj);
 *   setter.on('*', function (prop, value, old) {});
 *   setter.on('foo', function (value, old) {});
 *   // if property is a nested object, handler won't receive an old value
 *   setter.on('bar', function (value) {}); // will trigger on `bar.baz` change
 *
 * @param  {object} context
 * @return {Function}
 */
module.exports = function (context) {
	var setters = {};
	dispatcher.changed = changed;
	return emitter(dispatcher);
	function dispatcher(prop) {
		var setter = setters[prop] = setters[prop] || function (value) {
			if (!arguments.length) return dot.get(context, prop);
			var old = dot.get(context, prop);
			if (value === old) return;
			dot.set(context, prop, value);
			changed(prop, value, old);
		};
		setter.to = setter.to || function (value) {
			return setter.bind(null, value);
		};
		setter.type = setter.type || function (type) {
			return function (value) {
				if (arguments.length) setter(toType(type, value));
				else return toType(type, setter());
			};
		};
		return setter;
	}
	function changed(prop, value, old) {
		dispatcher.emit(prop, value, old);
		var parts = prop.split('.');
		var parent;
		while (parts.pop() && parts.length) {
			parent = parts.join('.');
			dispatcher.emit(parent, dot.get(context, parent));
		}
		dispatcher.emit('*', prop, value, old);
	}
};

function toType(type, value) {
	switch (type) {
		case 'string': return value + '';
		case 'number':
		case 'integer': return parseInt(value, 10) || 0;
		case 'float': return parseFloat(value) || 0;
		case 'boolean': return !!value;
	}
	return value;
}