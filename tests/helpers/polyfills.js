// GJS String.prototype.format() polyfill for Node.js test environment
if (!String.prototype.format) {
    String.prototype.format = function(...args) {
        let i = 0;
        return this.replace(/%[sd]/g, () => args[i++]);
    };
}
