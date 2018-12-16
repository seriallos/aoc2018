let fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const file = process.argv[2];

const IS_TEST_DATA = path.basename(file) === 'test.txt';

const write = (...args) => process.stdout.write(...args);

const printLine = (line, transform = null) => {
  for (let i = 0; i < line.length; i++) {
    let value = line[i];
    if (transform) {
      write(transform(value));
    } else {
      write(value);
    }
  }
  write('\n');
};

const printGrid = (grid, transform = null) => {
  for (let y = 0; y < grid.length; y++) {
    printLine(grid[y], transform);
  }
};

const int = i => parseInt(i, 10);

const main = async () => {
  const data = await fs.readFileAsync(path.join(file), 'utf8');
  const lines = _.filter(_.split(data, '\n'));
  const first = lines[0];

  let registers = [0, 0, 0, 0];
  const instructions = {
    addr: (reg, a, b, c) => reg[c] = reg[a] + reg[b],
    addi: (reg, a, b, c) => reg[c] = reg[a] + b,

    mulr: (reg, a, b, c) => reg[c] = reg[a] * reg[b],
    muli: (reg, a, b, c) => reg[c] = reg[a] * b,

    banr: (reg, a, b, c) => reg[c] = reg[a] & reg[b],
    bani: (reg, a, b, c) => reg[c] = reg[a] & b,

    borr: (reg, a, b, c) => reg[c] = reg[a] | reg[b],
    bori: (reg, a, b, c) => reg[c] = reg[a] | b,

    setr: (reg, a, b, c) => reg[c] = reg[a],
    seti: (reg, a, b, c) => reg[c] = a,

    gtir: (reg, a, b, c) => reg[c] = (a > reg[b] ? 1 : 0),
    gtri: (reg, a, b, c) => reg[c] = (reg[a] > b ? 1 : 0),
    gtrr: (reg, a, b, c) => reg[c] = (reg[a] > reg[b] ? 1 : 0),

    eqir: (reg, a, b, c) => reg[c] = (a === reg[b] ? 1 : 0),
    eqri: (reg, a, b, c) => reg[c] = (reg[a] === b ? 1 : 0),
    eqrr: (reg, a, b, c) => reg[c] = (reg[a] === reg[b] ? 1 : 0),
  };
  // filled these out by hand by running over and over
  const knownInstructions = [
    instructions.bori, // 0
    instructions.borr, // 1
    instructions.addi, // 2
    instructions.muli, // 3
    instructions.addr, // 4
    instructions.bani, // 5
    instructions.gtri, // 6
    instructions.setr, // 7
    instructions.gtrr, // 8
    instructions.seti, // 9
    instructions.eqir, // 10
    instructions.eqrr, // 11
    instructions.mulr, // 12
    instructions.eqri, // 13
    instructions.gtir, // 14
    instructions.banr, // 15
  ];
  const knownInstrNames = [
    'mulr',
    'addr',
    'borr',
    'bori',
    'addi',
    'muli',
    'seti',
    'eqri',
    'addr',
    'eqir',
    'gtrr',
    'eqrr',
    'gtri',
    'gtir',
    'setr',
    'banr',
    'bani',
  ];
  const process = (opcode, a, b, c) => {
    if (knownInstructions[opcode]) {
      knownInstructions[opcode](registers, a, b, c);
    } else {
      console.log('unknown instruction', opcode);
    };
  };
  let instruction;

  let samplesLike = 0;

  let inTestMode = false;
  _.each(lines, line => {
    let matches;
    if (matches = line.match(/Before:\s*\[(\d+), (\d+), (\d+), (\d+)\]/)) {
      const [, opcode, a, b, c] = matches;
      registers = _.map([opcode, a, b, c], int);
      inTestMode = true;
    } else if (matches = line.match(/After:\s*\[(\d+), (\d+), (\d+), (\d+)\]/)) {
      const [, opcode, a, b, c] = matches;
      const expected = _.map([opcode, a, b, c], int);
      let behavesLikes = 0;
      let possibleInstructions = [];
      _.each(instructions, (f, instrName) => {
        const testReg = [...registers];
        f(testReg, instruction[1], instruction[2], instruction[3]);
        if (_.isEqual(testReg, expected)) {
          if (!_.includes(knownInstrNames, instrName)) {
            possibleInstructions.push(instrName);
            behavesLikes++;
          }
        } else {
        }
      });
      if (behavesLikes === 1) {
        console.log(instruction[0], possibleInstructions);
      }
      if (behavesLikes >= 3) {
        samplesLike++;
      }
      inTestMode = false;
      registers = [0, 0, 0, 0];
    } else {
      instruction = _.map(_.split(line, ' '), int);
      if (!inTestMode) {
        process(...instruction);
      }
    }
  });

  console.log('Samples like 3+: ', samplesLike);

  console.log(registers);

  console.log('done');
};

main();
