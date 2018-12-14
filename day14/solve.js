let fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const file = process.argv[2];

const IS_TEST_DATA = path.basename(file) === 'test.txt';

const write = (...args) => process.stdout.write(...args);

const printGrid = (grid, transform = null) => {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; y++) {
      let value = grid[y][x];
      if (transform) {
        value = transform(x);
      }
      write(value);
    }
    write('\n');
  }
};

const main = async () => {
  const data = await fs.readFileAsync(path.join(file), 'utf8');
  const lines = _.filter(_.split(data, '\n'));
  const first = lines[0];

  let input;
  const startingBoard = '37';
  if (IS_TEST_DATA) {
    console.log('Running test data');
    input = '59414';
  } else {
    console.log('Running real data');
    input = '637061';
  }

  const elves = [];
  const elfHistory = [];
  const board = [];

  _.each(startingBoard, num => {
    board.push(parseInt(num));
    const boardIndex = board.length - 1;
    if (boardIndex < 2) {
      elves.push(boardIndex);
    }
  });

  const rotate = (b, steps) => {
    if (steps > 0) {
      for (let i = 0; i < steps; i++) {
        const tmp = b.shift();
        b.push(tmp);
      }
    } else {
      for (let i = 0; i > steps; i--) {
        const tmp = b.pop();
        b.unshift(tmp);
      }
    }
  }

  const after = parseInt(input);
  const report = 10;
  const maxGen = report + after;

  let i = 1;
  let found = false;
  let endIndex;
  while (!found) {
    if (i % 100000 === 0) {
      console.log(i);
    }
    // generate recipes
    const sum = _.sum(_.map(elves, e => board[e]));
    _.each(String(sum), num => {
      board.push(parseInt(num));
    });

    // find new recipe
    _.each(elves, (e, elfIndex) => {
      const steps = board[e] + 1;
      const nextIndex = (e + steps) % board.length;
      elves[elfIndex] = nextIndex;
    });

    // check for puzzle input in recipe list
    if (board.slice(-input.length).join('') === input) {
      found = true;
      endIndex = board.length - input.length;
    }
    if (board.slice(-(input.length + 1), -1 ).join('') === input) {
      found = true;
      endIndex = board.length - input.length - 1;
    }
    i++;
  }

  const num = parseInt(input);
  console.log(_.slice(board, -30).join(''));
  console.log(endIndex);

  console.log('Done');
};

main();
