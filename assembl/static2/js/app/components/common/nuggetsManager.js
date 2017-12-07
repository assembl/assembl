// @flow

import range from 'lodash/range';

import Nuggets from '../debate/thread/nuggets';

const indexNotFound = index => index === -1;

class NuggetsManager {
  nuggetsList: Array<Nuggets>;

  constructor() {
    this.nuggetsList = [];
  }

  add(nuggets: Nuggets) {
    this.nuggetsList.push(nuggets);
    this.sort();
    this.update();
  }

  update = () => {
    this.nuggetsList.reduce((previous, nuggets) => {
      nuggets.updateTop(previous);
      return nuggets;
    }, null);
  };

  remove(nuggets: Nuggets) {
    const index = this.nuggetsList.indexOf(nuggets);
    if (indexNotFound(index)) {
      throw new Error(`Tried to remove nuggets ${nuggets} that are not managed by this NuggetsManager`);
    }
    delete this.nuggetsList[index];
  }

  sort() {
    this.nuggetsList.sort((a, b) => {
      const aLevel = a.props.completeLevel.split('-');
      const bLevel = b.props.completeLevel.split('-');
      const maxIndex = Math.max(aLevel.length, bLevel.length);
      return range(maxIndex).reduce((diff, index) => {
        if (diff !== 0) return diff;
        // the two next lines convert for ex. a=[29,0] > b=[29,0,0] to a=[29,0,-1] > b=[29,0,0]
        const aValue = index < aLevel.length ? aLevel[index] : -1;
        const bValue = index < bLevel.length ? bLevel[index] : -1;
        return aValue - bValue;
      }, 0);
    });
  }
}

export default NuggetsManager;