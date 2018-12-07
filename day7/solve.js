let fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const file = process.argv[2];

const main = async () => {
  const data = await fs.readFileAsync(path.join(file), 'utf8');
  const lines = _.filter(_.split(data, '\n'));
  const first = lines[0];

  const steps = {};

  let numWorkers = 5;
  let baseWorkTime = 60;
  if (file === 'day7/test.txt') {
    numWorkers = 2;
    baseWorkTime = 0;
  }

  _.each(lines, line => {
    const [, start, next] = line.match(/Step (\w+) must be finished before step (\w+) can begin./);

    if (!steps[start]) {
      steps[start] = [];
    }
    if (!steps[next]) {
      steps[next] = [];
    }
    steps[next].push(start);
  });

  const output = [];
  const ready = [];

  const getStepTime = step => {
    return step.charCodeAt(0) - 'A'.charCodeAt(0) + 1 + baseWorkTime;
  };

  let activeWorkers = 0;
  const workers = [];
  for (let i = 0; i < numWorkers; i++) {
    workers[i] = {
      active: null,
      timeLeft: null,
    };
  }

  // find ready steps
  const updateReadySteps = () => {
    const inProgress = _.filter(_.map(workers, 'active'));
    _.each(steps, (prereqs, step) => {
      if (prereqs.length === 0 && !_.includes(output, step) && !_.includes(ready, step) && !_.includes(inProgress, step)) {
        ready.push(step);
      }
    });
    ready.sort();
  }
  updateReadySteps();

  let curTime = 0;

  console.log(ready);
  while (ready.length > 0 || activeWorkers > 0) {
    console.log(`-- time: ${curTime}, numReady: ${ready.length}, workers active: ${activeWorkers}, steps left: ${_.keys(steps).length}`);

    for (let i = 0; i < numWorkers; i++) {
      const worker = workers[i];
      if (worker.active) {
        worker.timeLeft--;
        if (worker.timeLeft === 0) {
          console.log(`worker ${i} is done with ${worker.active}`);
          output.push(worker.active);
          delete steps[worker.active];

          _.each(steps, (prereqs, step) => {
            steps[step] = _.without(prereqs, worker.active);
          });

          updateReadySteps();

          worker.active = null;
          activeWorkers--;
        } else {
          console.log(`worker ${i} is working on ${worker.active}, time left: ${worker.timeLeft}`);
        }
      }
    }
    for (let i = 0; i < numWorkers; i++) {
      const worker = workers[i];
      if (worker.active === null) {
        if (ready.length > 0) {
          const nextStep = ready.shift();
          worker.active = nextStep;
          worker.timeLeft = getStepTime(nextStep);
          activeWorkers++;
          console.log(`worker ${i} starting on step ${nextStep} (additional ready: ${ready.join('')})`);
        } else {
          // console.log(`worker ${i} is idle and there is no ready work`);
        }
      }
    }

    console.log(output.join(''));
    curTime++;
  }

  console.log(curTime - 1);

  /*
  //part 1
  while (ready.length > 0) {
    const cur = ready.shift();

    console.log(cur, getStepTime(cur));
    output.push(cur);
    delete steps[cur];

    _.each(steps, (prereqs, step) => {
      steps[step] = _.without(prereqs, cur);
    });

    // find ready steps
    updateReadySteps();
  }
  */

  console.log(output.join(''));

  console.log('done');
};

main();
