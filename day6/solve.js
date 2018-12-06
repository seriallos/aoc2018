let fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const main = async () => {
  const data = await fs.readFileAsync(path.join(__dirname, 'input.txt'), 'utf8');
  const rawLines = _.filter(_.split(data, '\n'));
  const first = rawLines[0];

  const coordCounts = [];
  const test = [
    '1, 1',
    '1, 6',
    '8, 3',
    '3, 4',
    '5, 5',
    '8, 9',
  ];

  const known = [];

  const invalidIndices = [];

  const bounds = {
    xMin: Infinity,
    xMax: -Infinity,
    yMin: Infinity,
    yMax: -Infinity,
  };

  const lines = rawLines;
  //const lines = test;

  _.each(lines, (line, idx) => {
    const [, xraw, yraw] = line.match(/(\d+), (\d+)/);

    const x = parseInt(xraw);
    const y = parseInt(yraw);

    coordCounts[idx] = 0;
    known.push([x, y]);

    if (x < bounds.xMin) {
      bounds.xMin = x;
    }
    if (x > bounds.xMax) {
      bounds.xMax = x;
    }
    if (y < bounds.yMin) {
      bounds.yMin = y;
    }
    if (y > bounds.yMax) {
      bounds.yMax = y;
    }
  });

  const dist = (ax, ay, bx, by) => {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  };


  const thresholdDist = 10000;
  //const thresholdDist = 10000;

  let withinThresh = 0;

  for(let x = bounds.xMin; x < bounds.xMax; x++) {
    for(let y = bounds.yMin; y < bounds.yMax; y++) {
      const dists = [];
      let closestIdx = null;
      let minDist = null;
      let tie = false;
      let onEdge = false;
      let totalDist = 0;
      _.each(known, (coord, idx) => {
        const cx = coord[0];
        const cy = coord[1];

        const distTo = dist(cx, cy, x, y);
        totalDist += distTo;

        if (minDist === null) {
          minDist = distTo;
          closestIdx = idx;
        } else if (distTo <= minDist) {
          closestIdx = idx;
          if (minDist === distTo) {
            tie = true;
          } else {
            tie = false;
          }
          minDist = distTo;
        }
      });
      if (totalDist < thresholdDist) {
        withinThresh++;
      }
    }
  }
  console.log(withinThresh);

  console.log('done');
};

main();
