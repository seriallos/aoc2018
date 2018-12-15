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
    for (let x = 0; x < grid[y].length; x++) {
      let value = grid[y][x];
      if (transform) {
        write(transform(value));
      } else {
        write(value);
      }
    }
    write('\n');
  }
};

const main = async () => {
  const data = await fs.readFileAsync(path.join(file), 'utf8');
  const lines = _.filter(_.split(data, '\n'));
  const first = lines[0];

  const HEIGHT = lines.length;
  const WIDTH = first.length;

  const printTile = tile => {
    if (tile.mob) {
      return tile.mob.type;
    }
    switch (tile.type) {
      case 'wall': return '#';
      case 'space': return '.';
      default: return '?';
    }
  };
  const printScore = score => _.isNull(score) ? '?' : (score >= 0 ? String(score) : '*');

  // in reading order
  const VALID_MOVES = [
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];
  const VALID_MOVES_REVERSE = _.reverse(VALID_MOVES);

  const distance = (t1, t2) => Math.abs(t1.x - t2.x) + Math.abs(t1.y - t2.y);
  const findMobs = map => _.map(_.filter(_.flatten(map), 'mob'), 'mob');
  const findTargets = (mob, mobs) => _.sortBy(_.map(
    _.filter(mobs, possible => !possible.dead && possible.id !== mob.id && possible.type !== mob.type),
    target => ({ mob: target, distance: distance(mob.tile, target.tile) }),
  ), 'distance');
  const adjacentTiles = (map, source) => {
    const tiles = [];
    _.each(VALID_MOVES, move => {
      const tile = map[source.y + move.y][source.x + move.x];
      if (tile.type === 'space' && tile.mob === null) {
        tiles.push(tile);
      }
    });
    return tiles;
  };
  const shortestPath = (map, source, destination) => {
    const maze = new Array(HEIGHT);
    for (let y = 0; y < HEIGHT; y++) {
      maze[y] = new Array(WIDTH);
      for (let x = 0; x < WIDTH; x++) {
        const tile = map[y][x];
        let score = null;
        if (x === source.x && y === source.y) {
          score = 0;
        } else if (tile.mob || tile.type === 'wall') {
          score = -1;
        }
        maze[y][x] = score;
      }
    }

    let queue = [source];
    let targetReached = false;
    let i = 0;
    do {
      const nextQueue = [];
      let p;
      while (p = queue.shift()) {
        const adjacent = adjacentTiles(map, p);
        _.each(adjacent, t => {
          if (maze[t.y][t.x] === null) {
            maze[t.y][t.x] = i + 1;
            nextQueue.push(t);
            if (t.x === destination.x && t.y === destination.y) {
              targetReached = true;
            }
          }
        });
      }
      queue = nextQueue;
      i++;
    } while (!targetReached && queue.length > 0);

    if (!targetReached) {
      return null;
    }

    let p = destination;
    const path = [];
    while (p.x !== source.x || p.y !== source.y) {
      path.unshift(p);

      let next;
      const curScore = maze[p.y][p.x];
      _.each(VALID_MOVES, move => {
        const moveScore = maze[p.y + move.y][p.x + move.x];
        if (moveScore !== null && moveScore !== -1 && moveScore < curScore) {
          next = map[p.y + move.y][p.x + move.x];
        }
      });
      p = next;
    }

    return path;
  };

  let testAp = 3;
  let winner;
  let losses;
  const maxAp = Infinity;

  do {
    winner = null;
    losses = {
      E: 0,
      G: 0,
    };
    const map = new Array(HEIGHT);

    let nextMobId = 0;

    for (let y = 0; y < HEIGHT; y++) {
      map[y] = new Array(WIDTH);
      for (let x = 0; x < WIDTH; x++) {
        const ch = lines[y][x];
        const tile = { x, y, mob: null };
        switch (ch) {
          case '#':
            tile.type = 'wall';
            break;
          case '.':
            tile.type = 'space';
            break;
          case 'E':
          case 'G':
            tile.type = 'space';
            const mob = {
              id: nextMobId++,
              type: ch,
              hp: 200,
              ap: ch === 'E' ? testAp : 3,
              tile,
            };
            tile.mob = mob;
            break;
          default:
            throw new Error('Unknown tile type');
        }
        map[y][x] = tile;
      }
    }


    let done = false;
    const maxRounds = Infinity;
    let round = 0;
    while (!done && round < maxRounds) {
      round++;
      //console.log();
      //console.log('-- ROUND', round);
      const mobs = findMobs(map);

      for (let m = 0; m < mobs.length; m++) {
        const mob = mobs[m];
        // in case mob died from a previous attack
        if (!mob.dead) {
          // find targets
          const targets = findTargets(mob, mobs);

          if (targets.length > 0) {
            if (targets[0].distance > 1) {
              const possibleTiles = _.sortBy(_.map(
                _.flatten(_.map(targets, target => adjacentTiles(map, target.mob.tile))),
                t => ({ tile: t, distance: distance(mob.tile, t) }),
              ), 'distance');
              if (possibleTiles.length > 0) {
                if (possibleTiles[0].distance === 0) {
                  // attack
                } else {
                  // MOVE

                  // find reachable
                  let paths = [];
                  let minDist = Infinity;
                  _.each(possibleTiles, possibleTile => {
                    const path = shortestPath(map, mob.tile, possibleTile.tile);
                    if (path) {
                      paths.push(path);
                      if (path.length < minDist) {
                        minDist = path.length;
                      }
                    }
                  });
                  if (paths.length > 0) {
                    paths = _.sortBy(
                      _.filter(paths, p => p.length === minDist),
                      path => {
                        const last = _.last(path);
                        return (1000 *last.y) + last.x;
                      },
                    );

                    // move
                    const move = paths[0][0];
                    const newTile = map[move.y][move.x];
                    mob.tile.mob = null;
                    newTile.mob = mob;
                    mob.tile = newTile;
                    //console.log(`Mob ${mob.type}${mob.id} move to ${newTile.x},${newTile.y}`);
                  }
                }
              } else {
                //console.log(`${mob.id} has no reachable spaces next to a target`);
              }
            }

            let attackTargets = _.sortBy(
              _.filter(findTargets(mob, mobs), { distance: 1 }),
              ['mob.hp', 'mob.tile.y', 'mob.tile.x'],
            );
            if (attackTargets.length > 0) {
              // attack
              let target = attackTargets[0].mob;
              target.hp -= mob.ap;
              //console.log(`${mob.type}${mob.id} attacks ${target.type}${target.id}, HP now ${target.hp}`);
              if (target.hp <= 0) {
                target.tile.mob = null;
                target.tile = null;
                target.dead = true;
                losses[target.type]++;
              }
            }
          } else {
            done = true;
            winner = mob.type;
          }
        }
      }
      //printGrid(map, printTile);
    }
    console.log('______');
    console.log(`AP ${testAp}, winner ${winner}, losses ${losses[winner]}`);
    printGrid(map, printTile);
    console.log(_.map(findMobs(map), m => _.pick(m, ['type', 'hp'])));

    const fullRounds = round - 1;
    const mobsLeft = findMobs(map);
    const hpRemain = _.sum(_.map(mobsLeft, 'hp'));

    console.log(`Done after ${fullRounds} full rounds, ${hpRemain} left, outcome = ${fullRounds * hpRemain}`);
    testAp++;
  } while ((winner !== 'E' || losses['E'] > 0) && testAp < maxAp);
};

main();
