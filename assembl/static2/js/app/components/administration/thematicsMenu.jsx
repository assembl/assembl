// @flow
import React from 'react';
import sortBy from 'lodash/sortBy';
import { Link } from 'react-router';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';

import withLoadingIndicator from '../common/withLoadingIndicator';
import { get } from '../../utils/routeMap';
import ThematicsDataQuery from '../../graphql/ThematicsDataQuery.graphql';

type Thematic = {
  id: string,
  order: number,
  children: Array<Thematic>
};

type Props = {
  rootSection: string,
  section: { sectionId: string },
  slug: { slug: string | null },
  phase: Phase,
  data: { thematics: Array<Thematic> }
};

class ThematicsMenu extends React.PureComponent<Props> {
  flatThematics = (thematics, parents = []) => {
    const resultThematics = [];
    if (thematics) {
      sortBy(thematics, 'order').forEach((thematic, index) => {
        const { children, ...thematicData } = thematic;
        const indexes = [...parents];
        indexes.push(index + 1);
        const newThematic = {
          ...thematicData,
          title: <Translate value="administration.menu.configureThematic" index={indexes.join('.')} />
        };
        resultThematics.push(newThematic);
        resultThematics.push(...this.flatThematics(children, indexes));
      });
    }
    return resultThematics;
  };

  render() {
    const { rootSection, section: { sectionId }, slug, phase, data: { thematics } } = this.props;
    const flatThematics = this.flatThematics(thematics);
    const sectionIndex = rootSection ? `${rootSection}.${sectionId}` : sectionId;
    const sectionQuery = `?section=${sectionIndex}`;
    return flatThematics.map(thematic => (
      <li key={thematic.id}>
        <Link
          to={`${get('administration', slug)}${get('adminPhase', {
            ...slug,
            phase: phase.identifier
          })}${sectionQuery}&thematicId=${thematic.id}`}
          activeClassName="active"
        >
          {thematic.title}
        </Link>
      </li>
    ));
  }
}

export default compose(
  graphql(ThematicsDataQuery, {
    options: ({ phase }) => ({
      variables: { identifier: phase.identifier }
    })
  }),
  withLoadingIndicator({ textHidden: true })
)(ThematicsMenu);