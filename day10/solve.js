let fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const file = process.argv[2];

const IS_TEST_DATA = path.basename(file) === 'test.txt';

const main = async () => {
  const data = await fs.readFileAsync(path.join(file), 'utf8');
  const lines = _.filter(_.split(data, '\n'));
  const first = lines[0];

  if (IS_TEST_DATA) {
    console.log('Running test data');
  } else {
    console.log('Running real data');
  }

  console.log();

  const vectors = [];
  _.each(lines, line => {
    let [, x, y, dx, dy] = line.match(/<\s*(-?\d+),\s*(-?\d+)\>.*\<\s*(-?\d+),\s*(-?\d+)\>/);

    x = parseInt(x);
    y = parseInt(y);
    dx = parseInt(dx);
    dy = parseInt(dy);

    vectors.push({
      x,
      y,
      dx,
      dy,
    });
  });

  const positionsAtTime = i => {
    return _.map(vectors, vec => ({
      x: vec.x + (vec.dx * i),
      y: vec.y + (vec.dy * i),
    }));
  };

  const getBounds = vectors => {
    bounds = {
      xMin: Infinity,
      xMax: -Infinity,
      yMin: Infinity,
      yMax: -Infinity,
    };
    _.each(vectors, ({ x, y }) => {
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
    return bounds;
  };

  printPositions = positions => {
    const bounds = getBounds(positions);
    const lookup = {};
    _.each(positions, ({ x, y }) => {
      if (!lookup[x]) {
        lookup[x] = {};
      }
      lookup[x][y] = true;
    });
    for (let y = bounds.yMin; y <= bounds.yMax; y++) {
      for (let x = bounds.xMin; x <= bounds.xMax; x++) {
        if (lookup[String(x)] && lookup[String(x)][String(y)]) {
          process.stdout.write('*');
        } else {
          process.stdout.write('.');
        }
      }
      process.stdout.write('\n');
    }
  };

  let i = 0;
  while (i < 100000) {
    const positions = positionsAtTime(i);
    const bounds = getBounds(positions);
    if (bounds.yMax - bounds.yMin < 20) {
      console.log();
      console.log('TIME =', i);
      printPositions(positions);
    }
    i++;
  }

  console.log('Done');
};

main();
