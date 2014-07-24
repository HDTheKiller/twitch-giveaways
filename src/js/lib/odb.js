var extend = require('extend');
var definer = require('definer');
var inherit = require('inherit');
var SortedList = require('sortedlist');
var emitter = require('emitter');

module.exports = ODB;

/**
 * Teturns a function that compares passed object with query object.
 *
 * @param  {Object} needle
 * @return {Function}
 */
function where(needle) {
	var keys = Object.keys(needle);
	var length = keys.length;
	return function matcher(obj) {
		for (var i = 0; i < length; i++)
			if (obj[keys[i]] !== needle[keys[i]]) return false;
		return true;
	};
}

/**
 * Object database constructor.
 *
 * @param {Object} model     Constructor of a model this DB is storing.
 * @param {Object} [options]
 */
function ODB(model, options) {
	extend(this, this.defaults, options);
	this._model = model;
	this.keystore = {};
	emitter(this);
	SortedList.call(this, this.orderFn, this.compareFn);
}

inherit(ODB, SortedList);

var slProto = SortedList.prototype;

definer(ODB.prototype)
	.type('m')
	.type('p', { writable: true })

	.m('insert', insert)
	.m('get', get)
	.m('set', set)
	.m('remove', remove)
	.m('key', key)
	.m('exists', exists)
	.m('find', find)
	.m('findAll', findAll)
	.m('reset', reset)

	.p('defaults', {
		prefix: 'k',
		orderFn: null,
		compareFn: null
	});

function insert (props) {
	var item = props instanceof this._model ? props : new this._model(props);
	if (this.exists(item.id)) {
		item = this.get(item.id).extend(props);
		this.emit('change', item);
	} else {
		item = this.keystore[this.key(item.id)] = item;
		slProto.insert.call(this, item);
		this.emit('insert', item);
	}
	return item;
}

function get(id) {
	return this.keystore[this.key(id)];
}

function set(id, prop, value) {
	var item = this.get(id);
	if (!item) return;
	if (typeof prop === 'string') item[prop] = value;
	else item.extend(prop);
	this.emit('change', item);
	return item;
}

function remove(id) {
	var type = typeof id;
	var item;
	if (type === 'string') {
		item = this.get(id);
		if (!item) return;
		this.splice(this.indexOf(item), 1);
		delete this.keystore[this.key(id)];
		this.emit('remove', item);
		return;
	}
	if (id instanceof this._model) return this.remove(id.id);
	if (type === 'object') id = where(id);
	else if (type !== 'function') return;
	for (var i = 0; i < this.length; i++) {
		item = this[i];
		if (id(item)) {
			this.remove(item.id);
			i--;
		}
	}
}

function key(id) {
	return this.prefix + id;
}

function exists(id) {
	return this.key(id) in this.keystore;
}

function find(needle) {
	return this.findAll(needle, 1)[0];
}

function findAll(needle, limit) {
	var type = typeof needle;
	if (type === 'string') return this.get(needle);
	var matches = type === 'function' ? needle : where(needle);
	var result = [];
	for (var i = 0; i < this.length; i++) {
		if (matches(this[i])) {
			result.push(this[i]);
			if (result.length === limit) return result;
		}
	}
	return result;
}

function reset() {
	delete this.keystore;
	this.keystore = {};
	slProto.reset.call(this);
}