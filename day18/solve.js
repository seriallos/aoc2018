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

const printGrid = (grid, { transform = null, bounds = null } = {}) => {
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

  const OPEN = '.';
  const TREE = '|';
  const YARD = '#';


  const grid = [];
  for (let y = 0; y < lines.length; y++) {
    grid[y] = [];
    for (let x = 0; x < first.length; x++) {
      grid[y][x] = lines[y][x];
    }
  }

  printGrid(grid);

  let history = [];
  const repeat = 28;
  const max = 500;

  const gridScore = grid => {
    let trees = 0;
    let yards = 0;
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        switch(grid[y][x]) {
          case TREE: trees++; break;
          case YARD: yards++; break;
        }
      }
    }
    return trees * yards;
  };

  let firstRepeat = false;

  for (let time = 1; time <= max; time++) {
    const initial = _.cloneDeep(grid);

    for (let y = 0; y < initial.length; y++) {
      for (let x = 0; x < initial[y].length; x++) {
        let trees = 0;
        let lumberyard = 0;
        let open = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) {
              // don't count self
            } else if (initial[y + dy] && initial[y + dy][x + dx]) {
              switch (initial[y + dy][x + dx]) {
                case OPEN: open++; break;
                case YARD: lumberyard++; break;
                case TREE: trees++; break;
              }
            }
          }
        }
        let current = initial[y][x];
        let next = current;
        if (current === OPEN && trees >= 3) {
          next = TREE;
        } else if (current === TREE && lumberyard >= 3) {
          next = YARD;
        } else if (current === YARD) {
          if (lumberyard >= 1 && trees >= 1) {
            next = YARD;
          } else {
            next = OPEN;
          }
        }
        grid[y][x] = next;
      }
    }

    const curScore = gridScore(grid);
    history[time % 28] = curScore;
  }

  console.log('part 1', gridScore(grid));
  console.log('part 2', history[1000000000 % 28]);


  console.log('done');
};

main();
