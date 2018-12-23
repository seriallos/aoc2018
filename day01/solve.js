let fs = require('fs');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const main = async () => {
  const data = await fs.readFileAsync('./input.txt', 'utf8');
  const changes = _.split(data, '\n');

  let currentFrequency = 0;

  const frequenciesSeen = new Set();
  frequenciesSeen.add(currentFrequency);

  let done = false;
  let loops = 0;
  while (!done) {
    _.each(changes, change => {
      if (change) {
        const value = parseInt(change, 10);
        currentFrequency += value;
        if (frequenciesSeen.has(currentFrequency)) {
          console.log(`Seen ${currentFrequency} twice, required ${loops} loops, saw ${frequenciesSeen.size} frequencies`);
          done = true;
          return false
        } else {
          frequenciesSeen.add(currentFrequency);
        }
      }
    });
    loops += 1;
  }
};

main();
