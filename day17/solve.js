let fs = require('fs');
const path = require('path');
const readline = require('readline');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const file = process.argv[2];

const IS_TEST_DATA = path.basename(file) === 'test.txt';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const waitForKey = async () => {
  return new Promise(accept => rl.question('Press return to continue', accept));
};

const write = (...args) => process.stdout.write(...args);

const printLine = (line, { transform = null, bounds = null }) => {
  const start = bounds ? bounds.xMin : 0;
  const end = bounds ? bounds.xMax + 1 : line.length
  for (let i = start; i < end; i++) {
    let value = line[i];
    if (transform) {
      write(transform(value));
    } else {
      write(value || ' ');
    }
  }
  write('\n');
};

const printGrid = (grid, { transform = null, bounds = null }) => {
  const start = bounds ? bounds.yMin : 0;
  const end = bounds ? (bounds.yMax + 1) : grid.length;
  for (let y = start; y < end; y++) {
    if (grid[y]) {
      write(_.padStart(y, 4, ' ') + '  ');
      printLine(grid[y], { transform, bounds });
    }
  }
};

const int = i => parseInt(i, 10);

const main = async () => {
  const data = await fs.readFileAsync(path.join(file), 'utf8');
  const lines = _.filter(_.split(data, '\n'));
  const first = lines[0];

  const springLocation = {
    x: 500,
    y: 0,
  };

  const SOURCE = '+';
  const SAND_DRY = '.';
  const SAND_WET = '|';
  const CLAY = '#';
  const WATER = '~';
  const CURRENT_WATER = '*';

  let scanBounds = { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity };
  const deposits = [];

  // find bounds
  _.each(lines, line => {
    const matches = line.match(/^([xy])=(\d+), ([xy])=(\d+)\.\.(\d+)$/);
    const [axisA, amountA, axisB, start, end] = [matches[1], int(matches[2]), matches[3], int(matches[4]), int(matches[5])];
    if (axisA === 'x') {
      scanBounds = {
        xMin: _.min([scanBounds.xMin, amountA]),
        xMax: _.max([scanBounds.xMax, amountA]),
        yMin: _.min([scanBounds.yMin, start, end]),
        yMax: _.max([scanBounds.yMax, start, end]),
      };
    } else {
      scanBounds = {
        xMin: _.min([scanBounds.xMin, start, end]),
        xMax: _.max([scanBounds.xMax, start, end]),
        yMin: _.min([scanBounds.yMin, amountA]),
        yMax: _.max([scanBounds.yMax, amountA]),
      };
    }
    deposits.push({
      axisA,
      amountA,
      axisB,
      start,
      end,
    });
  });

  const bounds = { ...scanBounds };
  bounds.xMin--;
  bounds.xMax++;
  bounds.yMin--;
  bounds.yMax++;
  console.log('scanBounds', scanBounds);
  console.log('bounds', bounds);

  const ground = [];

  // init grid
  for (let y = 0; y <= bounds.yMax; y++) {
    ground[y] = [];
    for (let x = bounds.xMin; x <= bounds.xMax; x++) {
      if (y === springLocation.y && x === springLocation.x) {
        ground[y][x] = SOURCE;
      } else {
        ground[y][x] = SAND_DRY;
      }
    }
  }

  // fill in deposits
  _.each(deposits, deposit => {
    for (let i = deposit.start; i <= deposit.end; i++) {
      if (deposit.axisA === 'x') {
        ground[i][deposit.amountA] = CLAY;
      } else {
        ground[deposit.amountA][i] = CLAY;
      }
    }
  });

  const getContinguous = (sy, sx, types, left = -Infinity, right = Infinity) => {
    const bounds = {};
    let x = sx;
    while (_.includes(types, ground[sy][x - 1]) && x >= left) {
      x--;
    }
    bounds.xMin = x;
    x = sx;
    while (_.includes(types, ground[sy][x + 1]) && x <= right) {
      x++;
    }
    bounds.xMax = x;
    bounds.length = 1 + bounds.xMax - bounds.xMin;
    return bounds;
  };

  const fillRow = (y, xMin, xMax, tile) => {
    for (let x = xMin; x <= xMax; x++) {
      ground[y][x] = tile;
    }
  }


  let simulationDone = false;
  let iterations = 0;
  let maxIterations = Infinity;
  while (!simulationDone && iterations < maxIterations) {
    iterations++;

    const debugDrop = (drop) => {
      console.log(iterations, drop);
      printGrid(ground, { bounds: {
        xMin: drop.x - 30,
        xMax: drop.x + 30,
        yMin: drop.y - 20,
        yMax: drop.y + 20,
      }});
    };
    let splits = [];

    const traceDrop = async (drop) => {
      let splitFinished = true;
      let done = false;
      while (!done) {
        if (drop.y >= bounds.yMax) {
          splitFinished = true;
          done = true;
        } else {
          // falling
          const down = ground[drop.y + 1][drop.x];
          if (down === SAND_DRY || down === SAND_WET) {
            ground[drop.y][drop.x] = SAND_WET;
            drop.y += 1;
          }

          if (down === CLAY || down === WATER) {
            /*
              #   #     #    #
              #####     #~~~~#

              #         #
              #####     #~~~~#

                  #
              #####


              #####
            */
            const platform = getContinguous(drop.y + 1, drop.x, [WATER, CLAY]);
            const fill = getContinguous(drop.y, drop.x, [SAND_DRY, SAND_WET], platform.xMin, platform.xMax);

            // bounded, fill with water
            if (fill.xMin > platform.xMin && fill.xMax < platform.xMax) {
              fillRow(drop.y, fill.xMin, fill.xMax, WATER);

              splitFinished = false;
              done = true;
            } else {
              // fill
              fillRow(drop.y, fill.xMin, fill.xMax, SAND_WET);
              if (fill.xMin < platform.xMin && fill.xMax > platform.xMax) {
                // split drop
                const split = { x: drop.x, y: drop.y };
                splitFinished = await traceDrop({ x: fill.xMax, y: drop.y, id: drop.id + 1 });
                drop.x = fill.xMin;
              } else if (fill.xMax > platform.xMax) {
                drop.x = fill.xMax;
              } else if (fill.xMin < platform.xMin) {
                drop.x = fill.xMin;
              }
            }
          }
        }
      }
      return splitFinished;
    }

    simulationDone = await traceDrop({ x: springLocation.x, y: springLocation.y + 1, id: 0 });
  }
  console.log();
  printGrid(ground, { bounds });
  console.log(scanBounds, bounds);
  console.log(iterations, 'iterations complete');

  let reachableTiles = 0;
  let settledTiles = 0;
  for (let y = scanBounds.yMin; y <= scanBounds.yMax; y++) {
    for (let x = scanBounds.xMin - 1; x <= scanBounds.xMax + 1; x++) {
      const tile = ground[y][x];
      if (tile === SAND_WET || tile === WATER) {
        reachableTiles += 1;
      }
      if (tile === WATER) {
        settledTiles += 1;
      }
    }
  }

  console.log('reachable tiles:', reachableTiles);
  console.log('settled tiles:', settledTiles);

  console.log('done');
};

main();
