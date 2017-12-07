import { SortingSelector, renderComponent } from 'searchkit';

class FilteredSortingSelector extends SortingSelector {
  render() {
    const { listComponent, filterPrefix } = this.props;
    let options = this.accessor.options.options;
    options = options.filter((sort) => {
      const keyPrefix = sort.key.split(':')[0];
      return keyPrefix === filterPrefix || keyPrefix === 'common';
    });
    const selected = [this.accessor.getSelectedOption().key];
    const disabled = !this.hasHits();

    return renderComponent(listComponent, {
      mod: this.props.mod,
      className: this.props.className,
      items: options,
      selectedItems: selected,
      setItems: this.setItems.bind(this),
      toggleItem: this.toggleItem.bind(this),
      disabled: disabled,
      urlBuilder: item => this.accessor.urlWithState(item.key),
      translate: this.translate
    });
  }
}

export default FilteredSortingSelector;