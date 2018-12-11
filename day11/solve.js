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

  let serialNumber;
  if (IS_TEST_DATA) {
    console.log('Running test data');
    serialNumber =  42;
  } else {
    console.log('Running real data');
    serialNumber = 9798;
  }

  const GRID_SIZE = 300;
  const powerLevels = new Array(GRID_SIZE);
  for (let x = 1; x <= GRID_SIZE; x++) {
    powerLevels[x] = new Array(GRID_SIZE);
    for(let y = 1; y <= GRID_SIZE; y++) {
      const rackId = x + 10;
      let initialPower = rackId * y;
      initialPower += serialNumber;
      initialPower *= rackId;
      const powerLevel = _.floor(initialPower / 100) % 10;

      powerLevels[x][y] = powerLevel - 5;
    }
  }

  let max = {
    total: -Infinity,
    x: null,
    y: null,
    size: null,
  };

  for (let size = 1; size <= GRID_SIZE; size++) {
    for (let x = 1; x <= GRID_SIZE - size; x++) {
      for (let y = 1; y <= GRID_SIZE - size; y++) {
        let total = 0;
        for (let xx = 0; xx < size; xx++) {
          for (let yy = 0; yy < size; yy++) {
            total += powerLevels[x + xx][y + yy];
          }
        }
        if (total > max.total) {
          max.total = total;
          max.x = x;
          max.y = y;
          max.size = size;
        }
      }
    }
  }
  console.log(max);

  console.log('Done');
};

main();
