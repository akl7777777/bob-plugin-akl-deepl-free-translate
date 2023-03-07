const CryptoJS = require("crypto-js");

function random(str) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str));
}

function random_safe(str) {
    return CryptoJS.enc.Base64.parse(str).toString(CryptoJS.enc.Utf8);
}

exports.random = random
exports.random_safe = random_safe
