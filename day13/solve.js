let fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const file = process.argv[2];

const IS_TEST_DATA = path.basename(file) === 'test.txt';

const write = (...args) => process.stdout.write(...args);

const main = async () => {
  const data = await fs.readFileAsync(path.join(file), 'utf8');
  const lines = _.filter(_.split(data, '\n'));
  const first = lines[0];

  if (IS_TEST_DATA) {
    console.log('Running test data');
  } else {
    console.log('Running real data');
  }

  const height = lines.length;
  const width = lines[0].length;


  const intersections = [];
  const carts = [];

  const track = new Array(height);

  const printTrack = () => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let cart;
        _.each(carts, c => {
          if (c.x === x && c.y === y) {
            cart = c;
            return false;
          }
        });
        if (cart) {
          if (cart.vx === 1) {
            write('>');
          } else if (cart.vx === -1) {
            write ('<');
          } else if (cart.vy === 1) {
            write('v');
          } else {
            write('^');
          }
        } else {
          write(track[y][x] || ' ');
        }
      }
      write('\n');
    }
    write('\n');
  };

  for (let y = 0; y < height; y++) {
    track[y] = new Array(width);
    for (let x = 0; x < width; x++) {
      if (_.includes('v<>^', lines[y][x])) {
        const cart = { x, y, vx: 0, vy: 0, turns: 0 };
        switch (lines[y][x]) {
          case '^':
            cart.vy = -1;
            track[y][x] = '|';
            break;
          case 'v':
            cart.vy = 1;
            track[y][x] = '|';
            break;
          case '<':
            cart.vx = -1;
            track[y][x] = '-';
            break;
          case '>':
            cart.vx = 1;
            track[y][x] = '-';
            break;
        }
        carts.push(cart);
      } else {
        track[y][x] = lines[y][x];
      }
    };
  }

  /* left turns
     1, 0  => 0, -1
     -1, 0 => 0, 1
     0, 1  => 1, 0
     0, -1 => -1, 0

     right turns
     1, 0  => 0, 1
     -1, 0 => 0, -1
     0, 1  => -1, 0
     0, -1 => 1, 0
  */
  const turnLeft = cart => {
    const { vx, vy } = cart;
    if (cart.vx) {
      cart.vx = 0;
      cart.vy = -vx;
    } else {
      cart.vx = vy;
      cart.vy = 0;
    }
  };
  const turnRight = cart => {
    const { vx, vy } = cart;
    if (cart.vx) {
      cart.vx = 0;
      cart.vy = vx;
    } else {
      cart.vx = -vy;
      cart.vy = 0;
    }
  };
  const turns = [
    c => { turnLeft(c); c.turns++; },
    c => { c.turns++; },
    c => { turnRight(c); c.turns++; },
  ];
  const numTurns = turns.length;

  let crash = null;
  let t = 0;
  while (_.size(_.filter(carts)) > 1) {
    for (let i = 0; i < carts.length; i++) {
      const cart = carts[i];
      if (cart) {
        cart.x += cart.vx;
        cart.y += cart.vy;
        const curTrack = track[cart.y][cart.x];
        switch (curTrack) {
          case '+':
            turns[cart.turns % numTurns](cart);
            break;
          case '/': {
            cart.vx ? turnLeft(cart) : turnRight(cart);
            break;
          }
          case '\\':
            cart.vx ? turnRight(cart) : turnLeft(cart);
            break;
        }
        // check for crashes
        for (let j = 0; j < carts.length; j++) {
          if (i !== j) {
            const otherCart = carts[j];
            if (cart && otherCart && cart.x === otherCart.x && cart.y === otherCart.y) {
              console.log(`Cart ${i} and ${j} have crashed at ${cart.x},${cart.y} at time ${t}`);
              carts[i] = null;
              carts[j] = null;
            }
          }
        }
      }
    }
    t++;
  }

  const lastCart = _.filter(carts)[0];
  console.log(`Last cart standing: ${lastCart.x},${lastCart.y}`);


  console.log('Done');
};

main();
