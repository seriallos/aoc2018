let fs = require('fs');
const path = require('path');

const _ = require('lodash');
const Promise = require('bluebird');

fs = Promise.promisifyAll(fs);

const main = async () => {
  const data = await fs.readFileAsync(path.join(__dirname, 'input.txt'), 'utf8');
  const lines = _.filter(_.split(data, '\n'));

  const sleepTime = {};
  const messages = [];

  _.each(lines, line => {
    const [, timestamp, message] = line.match(/^\[(.*)\] (.*)$/);

    const [, year, month, day, hour, minute] = timestamp.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/);

    messages.push({
      timestamp,
      sortable: `${year}${month}${day}${hour}${minute}`,
      minute,
      message,
    });
  });

  const sorted = _.sortBy(messages, 'sortable');

  let sleepTracker = [];
  let currentGuard = null;
  let sleepStart = null;

  let guardMinutes = {};
  let sleepiestMinute = null;
  let sleepiestMinuteGuard = null;
  let maxSleeps = null;

  _.each(sorted, ({ timestamp, message }) => {
    console.log(timestamp, message);
    const [, year, month, day, hour, minute] = timestamp.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+)/);
    if (matches = message.match(/Guard #(\d+) begins shift/)) {
      currentGuard = matches[1];
    } else if (message.match(/falls asleep/)) {
      sleepStart = minute;
    } else if (message.match(/wakes up/)) {
      sleepTracker.push({
        id: currentGuard,
        start: parseInt(sleepStart, 10),
        end: parseInt(minute, 10),
        duration: parseInt(minute, 10) - parseInt(sleepStart, 10),
      });

      for(let i = parseInt(sleepStart, 10); i < parseInt(minute, 10); i++) {
        if (!guardMinutes[currentGuard]) {
          guardMinutes[currentGuard] = {};
        }
        if (!guardMinutes[currentGuard][i]) {
          guardMinutes[currentGuard][i] = 0;
        }
        guardMinutes[currentGuard][i]++;

        if (maxSleeps === null || guardMinutes[currentGuard][i] > maxSleeps) {
          maxSleeps = guardMinutes[currentGuard][i];
          sleepiestMinute = i;
          sleepiestMinuteGuard = currentGuard;
        }
      }
    }
  });

  console.log(sleepiestMinuteGuard, sleepiestMinute, sleepiestMinute * sleepiestMinuteGuard);


  /*
  console.log(sleepTracker);

  const sleepByGuard = _.mapValues(
    _.groupBy(sleepTracker, 'id'),
    (sleeps, id) => {
      return _.reduce(sleeps, (result, {duration}) => result + duration, 0);
    },
  );

  const sleepByGuardArray = _.toPairs(sleepByGuard);
  const sleepiest = _.maxBy(sleepByGuardArray, ar => ar[1]);

  console.log(sleepiest)

  const sleepiestGuard = sleepiest[0];

  const sleepiestSleeps = _.filter(sleepTracker, { id: sleepiestGuard });

  console.log(sleepiestSleeps);

  const minutes = {};

  _.each(sleepiestSleeps, sleep => {
    for(let i = sleep.start; i < sleep.end; i++) {
      if (!minutes[i]) {
        minutes[i] = 0;
      }
      minutes[i]++;
    }
  });

  console.log(minutes);

  console.log(sleepiestGuard);
  */


  /*
    const date = new Date(timestamp);

    let matches;
    if (matches = message.match(/Guard #(.*) begins shift/)) {
      console.log(date, matches[1], 'begins');
      currentGuard = matches[1];
      sleepTime[currentGuard] = 0;
    } else if (matches = message.match(/wakes up/)) {
      console.log(date, currentGuard, 'wakes up');
      sleepTime[currentGuard] += date.getTime() - lastSleep.getTime();
    } else if (matches = message.match(/falls asleep/)) {
      console.log(date, currentGuard, 'falls asleep');
      lastSleep = date;
    } else {
      console.log('unable to parse line');
    }
  });
  */

  console.log('done');
};

main();
