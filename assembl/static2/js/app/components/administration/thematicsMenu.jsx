import React from 'react';
import { Link } from 'react-router';
import { graphql } from 'react-apollo';

import { get } from '../../utils/routeMap';
import ThematicsDataQuery from '../../graphql/ThematicsDataQuery.graphql';

class ThematicsMenu extends React.Component {
  render() {
    const { section, slug, phase, thematics } = this.props;
    if (thematics) {
      return thematics.map(thematic => (
        <li key={thematic.id}>
          <Link
            to={`${get('administration', slug)}${get('adminPhase', {
              ...slug,
              phase: phase.identifier
            })}?section=${section.sectionId}&thematicId=${thematic.id}`}
            activeClassName="active"
          >
            {thematic.title}
          </Link>
        </li>
      ));
    }
    return null;
  }
}
export default graphql(ThematicsDataQuery, {
  options: ({ phase, locale }) => ({
    variables: { identifier: phase.identifier, lang: locale }
  }),
  props: ({ data }) => {
    if (data.loading) {
      return {
        thematicsLoading: true
      };
    }
    if (data.error) {
      return {
        thematicsLoading: false,
        thematics: []
      };
    }
    return {
      thematicsLoading: data.loading,
      thematics: data.thematics
    };
  }
})(ThematicsMenu);