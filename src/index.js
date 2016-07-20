import { join } from 'path'
import partial from 'lodash/partial'

const { defineProperty } = Object

/**
 * Creates some functions that are useful when trying to decorate objects with hidden properties or getters,
 * or lazy loading properties, etc.  I use this a lot inside of constructor functions for singleton type objects.
 *
 * @param  {Object} target This is the object you intend to be decorating
 * @return {Object}        Returns an object with some wrapper functions around Object.defineProperty
 */
export function propertyUtils (target) {
  return {
    lazy: partial(lazy, target),
    hideProperty: partial(hideProperty, target),
    hideGetter: partial(hideGetter, target),
    hideProperties: partial(hideProperties, target),
  }
}

/**
 * Create a bunch of hidden or non-enumerable properties on an object.
 * Equivalent to calling Object.defineProperty with enumerable set to false.
 *
 * @param  {Object} target     The target object which will receive the properties
 * @param  {Object} properties =             {} a key/value pair of
 * @return {Object}            The target object
 */
export function hideProperties (target, properties = {}) {
  Object.keys(properties).forEach(propertyName => {
    hideGetter(target, propertyName, properties[propertyName])
  })

  return target
}

/**
 * Create a hidden getter property on the object.
 *
 * @param  {Object}   target  The target object to define the hidden getter
 * @param  {String}   name    The name of the property
 * @param  {Function} fn      A function to call to return the desired value
 * @param  {Object}   options =             {} Additional options
 * @param  {Object}   options.scope The scope / binding for the function will be called in, defaults to target
 * @param  {Array}    options.args arguments that will be passed to the function

 * @return {Object}          Returns the target object
 */
export function hideGetter(target, name, fn, options = {}) {
  if (typeof options === 'boolean') {
    options = { configurable: options }
  } else if (typeof options === 'object') {
    options = {
      configurable: true,
      scope: target,
      args: [],
      ...options,
    }
  } else {
    options = {}
  }

  fn = partial(fn, ...(options.args || []))

  defineProperty(target, name, {
    ...options,
    enumerable: false,
    get: function () {
      return (typeof (fn) === 'function' && options.call !== false) ? fn.call(options.scope) : fn
    }
  })

	return target
}

export function hideProperty (target, name, value, options = {}) {
  if (typeof options === 'boolean') {
    options = { configurable: options }
  } else if (typeof options === 'object') {
    options = {
      configurable: true,
      ...options,
    }
  } else {
    options = {}
  }

  defineProperty(target, name, {
    ...options,
    enumerable: false,
    value
  })

	return target
}

/**
 * Treats all values of an object as Promises and resolves them.

 * @param  {Object} obj The object which has the promises to be resolved
 * @return {Promise}    A Promise which will resolve with the object values
 */
export function promiseHash(obj) {
  var awaitables = []

  var keys = Object.keys(obj)

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    var a$ = obj[key]
    awaitables.push(a$)
  }

  return Promise.all(awaitables).then(function (results = {}) {
    var byName = {}
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      byName[key] = results[i]
    }
    return byName
  })
}

/**
 * Run nodes child_promise exec synchronously and capture the output, trimming any newlines or leading spaces
 * @param  {String} cmd     The command string, exactly the same as child_process.execSync
 * @param  {Object} options =             {} Any arguments for execSync will work here
 * @return {String}         Returns the command output
 */
export function execSync(cmd, options = {}) {
  return require('child_process').execSync(
    cmd, options
  ).toString().trim()
}

/**
 * Creates a lazy loading property on an object.

 * @param  {Object}   target     The target object to receive the lazy loader
 * @param  {String}   attribute  The property name
 * @param  {Function} fn         The function that will be memoized
 * @param  {[type]}   enumerable =             false Whether to make the property enumerable when it is loaded
 * @return {Object}              Returns the target object
 */
export function lazy (target, attribute, fn, enumerable = false) {
  defineProperty(target, attribute, {
    configurable: true,
    enumerable,
    get: function () {
      delete (target[attribute])

      if (enumerable) {
        return target[attribute] = fn.call(target)
      } else {
        let value = fn.call(target)

        defineProperty(target, attribute, {
          enumerable,
          configurable: true,
          value
        })

        return value
      }
    }
  })

  return target
}

export const DOMAIN_REGEX = /^[a-zA-Z0-9_-]+\.[.a-zA-Z0-9_-]+$/

export function isDomain(value) { return value.match(DOMAIN_REGEX) }

export function isPromise (obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'
}

export function isArray(arg) {
  return Object.prototype.toString.call(arg) === '[object Array]'
}

export function isRegex(val) {
  if ((typeof val === 'undefined' ? 'undefined' : typeof(val)) === 'object' &&
      Object.getPrototypeOf(val).toString() === '/(?:)/') {
    return true
  }

  return false
}

export function findPackageSync (packageName, root = process.cwd()) {
  const findModules = require('find-node-modules')
  var path = require('path')

  let moduleDirectories = findModules(root, {relative:false})

  let directory = moduleDirectories.find((p) => {
    let exists = pathExists(join(p, packageName))
    return exists
  })

  if (!directory) {
    try {
      let resolvedPath = path.dirname(require.resolve(packageName))
      return resolvedPath
    } catch(error) {
      //console.log('Error looking up package', packageName, error.message)
    }
  }

  return directory && path.resolve( path.join(directory, packageName))
}

export function findPackage (packageName) {
  return new Promise((resolve, reject) => {
    let moduleDirectories = findModules(process.cwd(), {relative:false})
    let directory = moduleDirectories.find((p) => {
      let exists = pathExists(join(p, packageName))
      return exists
    })

    if (!directory) {
      try {
        let resolvedPath = path.dirname(require.resolve(packageName))
        resolve(resolvedPath)
        return
      } catch(error) {

      }
    }

    if (!directory) { reject(packageName) }

    let result = path.resolve(path.join(directory, packageName))

    if(result) { resolve(result) }
  })
}

export function splitPath(p = '') {
   return path.resolve(p).split(path.sep)
}

export function pathExists(fp) {
  const fs = require('fs')
	var fn = typeof fs.access === 'function' ? fs.accessSync : fs.statSync

  try {
     fn(fp)
     return true
  } catch(error) {
    return false
  }
}

export function findPackageManifest (cwd = process.cwd()) {
  return require('findup-sync')('package.json', {cwd})
}

export function loadManifestFromDirectory (cwd = process.cwd()) {
  return require('findup-sync')('package.json', {cwd})
}
