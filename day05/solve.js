let fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const main = async () => {
  const data = await fs.readFileAsync(path.join(__dirname, 'input.txt'), 'utf8');
  const lines = _.filter(_.split(data, '\n'));

  const test = 'abBA';

  const inverseCase = ch => ch.match(/[a-z]/) ? _.toUpper(ch) : _.toLower(ch);

  let range = 'abcdefghijklmnopqrstuvwxyz';
  _.each(range, removeChar => {
    const charRemoved = lines[0].replace(new RegExp(removeChar, 'gi'), '');
    let prev;
    let output = '';
    _.each(charRemoved, char => {
      if (!prev) {
        prev = char;
        output += char;
      } else {
        if (prev === inverseCase(char)) {
          output = _.take(output, output.length - 1).join('');
          prev = output[output.length - 1];
        } else {
          output += char;
          prev = char;
        }
      }
    });
    console.log(output.length, removeChar);
  });

  // node day5/solve.js | sort -g

  console.log('done');
};

main();
