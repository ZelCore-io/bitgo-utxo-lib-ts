const groestlhash = require('groestl-hash-js')

export function groestl(buffer) {
  return Buffer.from(groestlhash.groestl_2(buffer, 1, 3), 'hex');
}