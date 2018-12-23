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

  const license = _.map(_.split(_.trim(first), ' '), i => parseInt(i, 10));

  let metadataTotal = 0;
  const nodeStack = [];


  const getNodeName = nodeId => String.fromCharCode('A'.charCodeAt(0) + nodeId);

  const parseLicense = (data) => {
    const nodeData = [...data];
    const nodeValues = [];

    const parseNode = (nodeId = 0) => {
      const nodes = [];
      const numChildren = nodeData.shift();
      const numMetadata = nodeData.shift();

      // recurse through children
      const childValues = [];
      for (let j = 0; j < numChildren; j++) {
        childValues[j] = parseNode(nodeId + j + 1);
      }

      // collect metadata
      const nodeMetadata = []
      for (let j = 0; j < numMetadata; j++) {
        nodeMetadata.push(nodeData.shift());
      }

      // part 1
      metadataTotal += _.sum(nodeMetadata);

      // part 2
      if (numChildren === 0) {
        return _.sum(nodeMetadata);
      } else {
        const referencedValues = _.map(nodeMetadata, childId => childValues[childId - 1] || 0);
        return _.sum(referencedValues);
      }
    }

    return parseNode();
  };

  const rootValue = parseLicense(license);

  console.log(`Part 1: ${metadataTotal}`);
  console.log(`Part 2: ${rootValue}`);

  console.log('done');
};

main();
