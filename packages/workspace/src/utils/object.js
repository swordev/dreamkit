function isPlainObject(input) {
  return Object.prototype.toString.call(input) === "[object Object]";
}

export function sortObject(object) {
  if (!isPlainObject(object)) return object;
  let newObject = {};
  Object.keys(object)
    .sort()
    .forEach((key) => {
      const value = object[key];
      newObject[key] = isPlainObject(value) ? sortObject(value) : value;
    });
  return newObject;
}

export function compareObjects(object1, object2) {
  return (
    JSON.stringify(sortObject(object1)) === JSON.stringify(sortObject(object2))
  );
}
