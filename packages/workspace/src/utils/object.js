// @ts-check
/**
 *
 * @param {any} input
 * @returns {Boolean}
 */
function isPlainObject(input) {
  return Object.prototype.toString.call(input) === "[object Object]";
}

/**
 *
 * @param {any} object
 * @returns {any}
 */
export function sortObject(object) {
  if (!isPlainObject(object)) return object;
  /** @type {Record<string, string>} */
  let newObject = {};
  Object.keys(object)
    .sort()
    .forEach((key) => {
      const value = object[key];
      newObject[key] = isPlainObject(value) ? sortObject(value) : value;
    });
  return newObject;
}

/**
 * @param {any} object1
 * @param {any} object2
 * @returns {boolean}
 */
export function compareObjects(object1, object2) {
  return (
    JSON.stringify(sortObject(object1)) === JSON.stringify(sortObject(object2))
  );
}
