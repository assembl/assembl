import { TermQuery, FacetAccessor, MenuFilter } from 'searchkit';
import map from 'lodash/map';

class CustomFacetedAccessor extends FacetAccessor {
  buildSharedQuery(query) {
    let q = query;
    const filters = this.state.getValue();
    // If All is selected (filters is the empty array), do the elasticsearch query with all the terms (include option)
    const filterTerms = map(filters.length > 0 ? filters : this.options.include || [], filter =>
      this.fieldContext.wrapFilter(TermQuery(this.options.field, filter))
    );
    const selectedFilters = map(filters, filter => ({
      name: this.options.title || this.translate(this.options.field),
      value: this.translate(filter),
      id: this.options.id,
      remove: () => {
        this.state = this.state.remove(filter);
      }
    }));
    const boolBuilder = this.getBoolBuilder();
    if (filterTerms.length > 0) {
      q = q.addFilter(this.uuid, boolBuilder(filterTerms)).addSelectedFilters(selectedFilters);
    }

    return q;
  }
}

class MenuFilterCustomAll extends MenuFilter {
  defineAccessor() {
    return new CustomFacetedAccessor(this.props.id, this.getAccessorOptions());
  }
}

export default MenuFilterCustomAll;