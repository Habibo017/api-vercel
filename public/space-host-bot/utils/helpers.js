const readlineSync = require("readline-sync");

function question(prompt) {
  return readlineSync.question(prompt);
}

function onlyNumbers(value) {
  return /^\d+$/.test(value);
}

module.exports = { question, onlyNumbers };
