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

  let registers = [0, 0, 0, 0, 0, 0];
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
  const process = (opcode, a, b, c) => {
    instructions[opcode](registers, a, b, c);
  };
  let instruction;
  let instructionPointer;

  const program = [];

  _.each(lines, line => {
    let matches;
    if (matches = line.match(/^#ip (\d+)$/)) {
      instructionPointer = int(matches[1]);
    } else {
      instruction = _.split(line, ' ');
      const opcode = instruction[0];
      const [a, b, c] = [int(instruction[1]), int(instruction[2]), int(instruction[3])];
      program.push([opcode, a, b, c]);
    }
  });

  const runProgram = async (debug = false) => {
    let instr = 0;
    let instrExecuted = 0;
    const bail = Infinity;
    while (instr >= 0 && instr < program.length && instrExecuted < bail) {
      registers[instructionPointer] = instr;
      const [opcode, a, b, c] = program[instr];
      let debugOut = `ip=${instructionPointer} [${registers.join(', ')}] ${opcode} ${a} ${b} ${c} `;
      process(opcode, a, b, c);
      instrExecuted++;
      debugOut += `[${registers.join(', ')}]`;
      instr = registers[instructionPointer];
      instr++;
      if (debug) {
        write(`${debugOut}\n`);
        await waitForKey();
      }
    }
    console.log('executed', instrExecuted, 'instructions');
  }
  await runProgram(false);
  console.log('Part 1:', registers[0], registers);

  registers = [1, 0, 0, 0, 0, 0];

  // oh, it's sum of factors but really slow

  //registers[0] = 1;
  //await runProgram(true);

  let number = 10551298;
  let sumOfFactors = 0;
  for (let i = number; i >= 1; i--) {
    if (number % i === 0) {
      sumOfFactors += i;
    }
  }

  console.log('Part 2:', sumOfFactors);

  console.log('done');
};

main();
