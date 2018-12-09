let fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const file = process.argv[2];

const IS_TEST_DATA = path.basename(file) === 'test.txt';

class Node {
  constructor(value) {
    this.value = value;
    this.previous = null
    this.next = null;
  }
}

// not really a real doublylinkedlist, this is custom for the marble game
class DoublyLinkedList {
  constructor() {
    this.current = null;
  }
  addMarble(value) {
    const node = new Node(value);
    if (this.current === null) {
      node.next = node;
      node.previous = node;
      this.current = node;
    } else {
      const insert = this.current.next;

      node.previous = insert;
      node.next = insert.next;

      node.previous.next = node;
      node.next.previous = node;

      this.current = node;
    }
  }
  remove() {
    let remove = this.current;
    let move = 7;
    while (move-- > 0) {
      remove = remove.previous;
    }

    remove.previous.next = remove.next;
    remove.next.previous = remove.precious;

    this.current = remove.next;

    return remove.value;
  }
  print() {
    let cursor = this.current;
    do {
      process.stdout.write(' ' + cursor.value);
      cursor = cursor.next;
    } while (cursor !== this.current);
    process.stdout.write('\n');
  }
}

const main = async () => {
  const data = await fs.readFileAsync(path.join(file), 'utf8');
  const lines = _.filter(_.split(data, '\n'));
  const first = lines[0];

  if (IS_TEST_DATA) {
    console.log('Running test data');
  } else {
    console.log('Running real data');
  }

  console.log();

  let [, numPlayers, numMarbles] = first.match(/(\d+) .* (\d+)/);
  numPlayers = parseInt(numPlayers, 10);
  // remove the 100 * for part 1 solution
  numMarbles = 100 * parseInt(numMarbles, 10);

  let currentPlayer;
  const scores = [];

  for (let i = 0; i < numPlayers; i++) {
    scores[i] = 0;
  }

  const list = new DoublyLinkedList();

  for (let turn = 0; turn <= numMarbles; turn++) {
    currentPlayer = turn % numPlayers + 1;

    if (turn === 0 || turn % 23 !== 0) {
      list.addMarble(turn);
    } else {
      const removed = list.remove();

      scores[currentPlayer - 1] += removed + turn;
    }

    if (turn < 30) {
      list.print();
    }
  }

  console.log('High score', _.max(scores));

  console.log('Done');
};

main();
