let fs = require('fs');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const main = async () => {
  const data = await fs.readFileAsync('./input.txt', 'utf8');
  const boxIds = _.filter(_.split(data, '\n'));

  /*
  let hasDoubles = 0;
  let hasTriples = 0;

  _.each(boxIds, boxId => {
    console.log(boxId);
    const letterCounts = _.countBy(boxId);
    console.log(letterCounts);
    if (_.find(letterCounts, lc => lc === 2)) {
      hasDoubles += 1;
    }
    if (_.find(letterCounts, lc => lc === 3)) {
      hasTriples += 1;
    }
  });
  console.log('box checksum = ', hasDoubles * hasTriples);
  */

  _.each(boxIds, sourceBoxId => {
    _.each(boxIds, compareBoxId => {
      if (sourceBoxId !== compareBoxId) {
        let diffs = 0;
        let same = '';
        for(let i = 0; i < sourceBoxId.length; i += 1) {
          if (sourceBoxId[i] !== compareBoxId[i]) {
            diffs += 1;
          } else {
            same += sourceBoxId[i];
          }
        }
        if (diffs === 1) {
          console.log(same);
          process.exit(0);
        }
      }
    });
  });
};

main();
