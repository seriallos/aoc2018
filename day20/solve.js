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

  class Room {
    constructor(x, y) {
      this.x = x;
      this.y = y;

      this.north = null;
      this.west = null;
      this.east = null;
      this.south = null;
    }
  };

  const rooms = [];
  const bounds = {
    x: {
      min: Infinity,
      max: -Infinity,
    },
    y: {
      min: Infinity,
      max: -Infinity,
    },
  };

  const addRoom = (x, y) => {
    if (!rooms[y]) {
      rooms[y] = [];
    }
    if (!rooms[y][x]) {
      rooms[y][x] = new Room(x, y);
    }

    if (x < bounds.x.min) bounds.x.min = x;
    if (x > bounds.x.max) bounds.x.max = x;
    if (y < bounds.y.min) bounds.y.min = y;
    if (y > bounds.y.max) bounds.y.max = y;

    return rooms[y][x];
  };
  const getRoom = (x, y) => {
    return rooms[y][x];
  };

  const dirs = {
    N: [0, -1],
    E: [1, 0],
    S: [0, 1],
    W: [-1, 0],
  };

  const start = addRoom(0, 0);
  let currentRoom = start;

  let branches = [];
  let paths = [''];
  let depth = 0;
  _.each(first, ch => {
    switch (ch) {
      case '^':
      case '$':
        break;
      case 'N':
      case 'E':
      case 'S':
      case 'W': {
        const newRoom = addRoom(...[currentRoom.x + dirs[ch][0], currentRoom.y + dirs[ch][1]]);
        if (ch === 'N') {
          currentRoom.north = newRoom;
          newRoom.south = currentRoom;
        } else if (ch === 'E') {
          currentRoom.east = newRoom;
          newRoom.west = currentRoom;
        } else if  (ch === 'S') {
          currentRoom.south = newRoom;
          newRoom.north = currentRoom;
        } else if (ch === 'W') {
          currentRoom.west = newRoom;
          newRoom.east = currentRoom;
        } else {
          throw new Error('wat');
        }
        currentRoom = newRoom;
        branches[depth] = currentRoom;
        paths[depth] += ch;
        break;
      }
      case '(':
        depth++;
        paths[depth] = '';
        break;
      case '|':
        paths[depth] = '';
        currentRoom = branches[depth - 1];
        break;
      case ')':
        depth--;
        branches.pop();
        paths.pop();
        currentRoom = branches[depth];
        break;
      default:
        console.error("unhandled character", ch);
        break;
    }
  });

  console.log(bounds);
  const printRooms = () => {
    for (let y = bounds.y.min; y <= bounds.y.max; y++) {
      for (let x = bounds.x.min; x <= bounds.x.max; x++) {
        const room = getRoom(x, y);
        if (room) {
          const { visited } = room;
          if (room.north && room.east && room.south && room.west) {
            write(visited ? '╋' : '┼');
          } else if (room.north && room.east && room.south) {
            write(visited ? '┣' : '├');
          } else if (room.north && room.east && room.west) {
            write(visited ? '┻' : '┴');
          } else if (room.north && room.west && room.south) {
            write(visited ? '┫' : '┤');
          } else if (room.south && room.east && room.west) {
            write(visited ? '┳' : '┬');
          } else if (room.north && room.east) {
            write(visited ? '┗' : '└');
          } else if (room.east && room.south) {
            write(visited ? '┏' : '┌');
          } else if (room.south && room.west) {
            write(visited ? '┓' : '┐');
          } else if (room.west && room.north) {
            write(visited ? '┛' : '┘');
          } else if (room.north && room.south) {
            write(visited ? '┃' : '│');
          } else if (room.west && room.east) {
            write(visited ? '━' : '─');
          } else if (room.north) {
            write(visited ? '╹' : '╵');
          } else if (room.east) {
            write(visited ? '╺' : '╶');
          } else if (room.south) {
            write(visited ? '╻' : '╷');
          } else if (room.west) {
            write(visited ? '╸' : '╴');
          } else {
            write('?');
          }
        } else {
          write(' ');
        }
      }
      write('\n');
    }
  }

  printRooms();

  let thousandRooms = 0;
  let longest = 0;
  depth = 0;
  const toVisit = [];
  const distances = [];

  toVisit.push(start);
  distances.push(-1);

  while (toVisit.length > 0) {
    const initialSize = toVisit.length;
    const room = toVisit.pop();
    distances[initialSize - 1] += 1;
    const currentDistance = distances[initialSize - 1];
    if (_.isNaN(currentDistance)) {
      printRooms();
      console.log(distances);
      await waitForKey();
    }
    if (currentDistance > longest) {
      longest = currentDistance;
    }
    if (currentDistance >= 1000) {
      thousandRooms++;
    }
    if (!room.visited) {
      room.visited = true;
      if (room.north && !room.north.visited) {
        toVisit.push(room.north);
      }
      if (room.east && !room.east.visited) {
        toVisit.push(room.east);
      }
      if (room.south && !room.south.visited) {
        toVisit.push(room.south);
      }
      if (room.west && !room.west.visited) {
        toVisit.push(room.west);
      }
      if (toVisit.length > initialSize) {
        // branch
        for (let i = 0; i < toVisit.length - initialSize; i++) {
          distances.push(currentDistance);
        }
      } else if (toVisit.length < initialSize) {
        // dead end
        distances.pop();
      }
    }
  }

  printRooms();


  console.log('Part 1:', longest);
  console.log('Part 2:', thousandRooms);

  console.log('done');
};

main();
