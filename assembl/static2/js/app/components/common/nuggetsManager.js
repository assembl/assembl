// @flow

import Nuggets from '../debate/thread/nuggets';

const invalidIndex = (index) => {
  return index === -1;
};

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
    if (invalidIndex(index)) throw new Error('Tried to remove nuggets that are not managed by this NuggetsManager');
    delete this.nuggetsList[index];
  }
  sort() {
    this.nuggetsList.sort((a, b) => {
      const aLevel = a.props.completeLevel.split('-');
      const bLevel = b.props.completeLevel.split('-');
      return aLevel.some((aLevelValue, index) => {
        if (index >= bLevel.length) return true;
        return aLevelValue > bLevel[index];
      });
    });
  }
}

export default NuggetsManager;