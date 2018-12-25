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
    let lowestR1 = Infinity;
    const seen = new Set();
    const bail = Infinity;
    while (instr >= 0 && instr < program.length && instrExecuted < bail) {
      registers[instructionPointer] = instr;
      const [opcode, a, b, c] = program[instr];
      process(opcode, a, b, c);
      instrExecuted++;
      if (debug || instr == 28) {
        if (!seen.has(registers[1])) {
          seen.add(registers[1]);
          console.log(registers[1]);
        } else {
          console.log('already seen', registers[1]);
        }
        //write(`${debugOut}\n`);
        //await waitForKey();
      }
      instr = registers[instructionPointer];
      instr++;
    }
    console.log('executed', instrExecuted, 'instructions');
  }

  registers = [0, 0, 0, 0, 0, 0];
  await runProgram(false);

  // find first value by inspecting memory at the right time
  console.log('Part 1:', 11285115);

  // brute forced the solution by keeping track of previously seen values looking for a loop in r1 values.
  // worked on rewriting the assembly into JS I could run faster / figure out how to rewrite/optimize
  // but had to run AFK and figured I could just brute force finding the repeat
  console.log('Part 2:', '');

    /*
  r1 = 0;
  do {
    r3 = 65536;
    r1 = 10905776;

    r4 = r3 & 255;
    r1 = r4 + 1;
    r1 = r1 & 16777215;
    r1 = r1 * 65889;
    r1 = r1 & 16777215;
    if (r3 > 256) {
      r4 = 0;
      do {
        r5 = r4 + 1;
        r5 *= 256;
        r4++;
      } while (r3 != r5);
    }
    r3 = r4;
  } while (r1 != r0);
  */

  console.log('done');
};

main();
