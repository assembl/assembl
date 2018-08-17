import { TagFilter } from 'searchkit';

export default class UserMessagesTagFilter extends TagFilter {
  handleClick = () => {
    const { value } = this.props;
    const typeAccessor = this.searchkit.accessors.statefulAccessors.type;
    const qAccessor = this.searchkit.accessors.queryAccessor;
    const creatorIdAccessor = this.searchkit.accessors.statefulAccessors.creator_id;
    if (!qAccessor) {
      console.error('Missing accessor for q in UserMessagesTagFilter'); // eslint-disable-line no-console
      return;
    }
    if (!typeAccessor) {
      console.error('Missing accessor for type in UserMessagesTagFilter'); // eslint-disable-line no-console
      return;
    }
    if (!creatorIdAccessor) {
      console.error('Missing accessor for creator_id in UserMessagesTagFilter'); // eslint-disable-line no-console
      return;
    }

    creatorIdAccessor.state = creatorIdAccessor.state.toggle(value);
    typeAccessor.state = typeAccessor.state.toggle('post');
    qAccessor.state = qAccessor.state.toggle(null);
    this.searchkit.performSearch();
  };

  isActive() {
    // we don't care about this here as we are changing type to posts on click
    return false;
  }
}