/**
 * Decode a URI encoded string.
 *
 * @param {String} input The URI encoded string.
 * @returns {String|Null} The decoded string.
 * @api private
 */
function decode(input: string) {
    try {
        return decodeURIComponent(input.replace(/\+/g, ' '));
    } catch (e) {
        return null;
    }
}

/**
 * Simple query string parser.
 *
 * @param {string} query The query string that needs to be parsed.
 */
export function querystring(query: string): object {
    const parser = /([^=?&]+)=?([^&]*)/g;
    const result: {
        [key: string]: string;
    } = {};
    let part = parser.exec(query);

    while (part) {
        const key = decode(part[1]);
        const value = decode(part[2]);

        //
        // Prevent overriding of existing properties. This ensures that build-in
        // methods like `toString` or __proto__ are not overriden by malicious
        // querystrings.
        //
        // In the case if failed decoding, we want to omit the key/value pairs
        // from the result.
        //
        if (key === null || value === null || key in result) {
            continue;
        }
        result[key] = value;
        part = parser.exec(query);
    }

    return result;
}

/**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
export function querystringify(obj: object) {
    return Object.keys(obj)
        .map(k => `${k}=${obj[k]}`)
        .join('&');
}
