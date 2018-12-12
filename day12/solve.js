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

  const inputToBool = p => p === '#' ? true : false;
  const boolToInput = b => b ? '#' : '.';

  // I was playing around with fastest methods of calculating arbitrary lengths of generations
  // and did some crazy stuff converting plant layouts into numbers to avoid a bunch of nested
  // inner loops

  const boolArrayToInt = arr => {
    let result = 0;
    let mult = 1;
    let b;
    while (arr.length > 0) {
      b = arr.pop();
      if (b) {
        result += mult;
      }
      mult *= 2;
    }
    return result;
  };

  const [, initialStateRaw] = first.match(/initial state: (.*)/);
  const initialState = _.map(initialStateRaw, inputToBool);

  const rules = [];

  lines.shift();

  _.each(lines, line => {
    const [, rule, result] = line.match(/^(.*) => (.*)$/);
    if (result) {
      const num = boolArrayToInt(_.map(rule, inputToBool));
      rules[num] = inputToBool(result);;
    }
  });

  const printState = (state, left, right) => {
    for (let i = left; i < right; i++) {
      process.stdout.write(boolToInput(state[i]));
    }
  };

  //const GENERATIONS = 50000000000;
  //const GENERATIONS = 500000;
  const GENERATIONS = 20;

  let state = [ ...initialState ];

  process.stdout.write('generation 0: ');
  printState(state, -5, 30);
  process.stdout.write('\n');

  let leftEdge = 0;
  let rightEdge = state.length;

  let lastTotal = null;
  for (let i = 1; i <= GENERATIONS; i++) {
    let nextState = new Array(rightEdge - leftEdge);
    let newLeft = Infinity;
    let newRight = -Infinity;
    for (let x = leftEdge - 2; x < rightEdge + 2; x++) {
      let num = 0;
      let mult = 2 ** 4;
      for (let xx = -2; xx <= 2; xx++) {
        if (state[xx + x]) {
          num += mult;
        }
        mult /= 2;
      }

      if (rules[num]) {
        nextState[x] = true;
      } else {
        nextState[x] = false;
      }

      if (nextState[x] && x < newLeft) {
        newLeft = x;
      }
      if (nextState[x] && x > newRight) {
        newRight = x + 1;
      }
    }

    leftEdge = newLeft;
    rightEdge = newRight;

    state = nextState;

    let total = 0;
    for (let x = leftEdge; x <= rightEdge; x++) {
      if (state[x]) {
        total += x;
      }
    }
    if (!lastTotal) {
      lastTotal = total;
    } else {
      lastTotal = total;
    }

    /*
    process.stdout.write('generation ' + i + ': ');
    printState(state, leftEdge, rightEdge);
    process.stdout.write('   ' + leftEdge + ', ' + rightEdge + ', ' + total);
    process.stdout.write('\n');
    */

    if (i % 10000 === 0) {
      console.log(`${i} / ${GENERATIONS} = ${_.round(100 * (i / GENERATIONS))}%, ${leftEdge},${rightEdge}, ${rightEdge - leftEdge}`);
    }
  }

  // converge at gen 111 at 3010 total
  // 112 - 3033
  // 113 - 3056
  // shift 23 every gneration

  console.log('Part 1:', lastTotal);

  console.log('Part 2:', 3010 + ((50000000000 - 111) * 23));

  console.log('Done');
};

main();
