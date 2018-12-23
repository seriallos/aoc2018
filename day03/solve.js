let fs = require('fs');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const main = async () => {
  const data = await fs.readFileAsync('input.txt', 'utf8');
  const lines = _.filter(_.split(data, '\n'));

  const canvas = [];

  const candidates = new Set();
  _.each(lines, line => {
    const [, id, left, top, width, height] = line.match(/\#(\d+) @ (\d+),(\d+): (\d+)x(\d+)/);
    candidates.add(id);
  });

  for(let i = 0; i < 1000; i++) {
    canvas[i] = [];
    for(let j = 0; j < 1000; j++) {
      canvas[i][j] = new Set();
    }
  }

  let overlap = 0;

  const int = i => parseInt(i, 10);

  _.each(lines, line => {
    const [, id, left, top, width, height] = line.match(/\#(\d+) @ (\d+),(\d+): (\d+)x(\d+)/);
    for(let i = int(left); i < int(left) + int(width); i++) {
      for(let j = int(top); j < int(top) + int(height); j++) {
        canvas[i][j].add(id);
        if (canvas[i][j].size > 1) {
          _.each(Array.from(canvas[i][j]), id => {
            candidates.delete(id);
          });
        }
      }
    }
  });

  console.log(candidates);
};

main();
