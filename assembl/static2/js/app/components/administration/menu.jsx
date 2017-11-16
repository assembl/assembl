import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';

class Menu extends React.Component {
  render() {
    const slug = { slug: getDiscussionSlug() };
    const { timeline } = this.props.debate.debateData;
    const { locale, translations } = this.props.i18n;
    const { requestedPhase } = this.props;
    return (
      <ul className="admin-menu">
        <li className="menu-item">
          <Link to={`${get('administration', slug)}/discussion`} activeClassName="active">
            <Translate value="administration.edition" />
          </Link>
          <ul className={requestedPhase === 'discussion' ? 'shown admin-menu2' : 'hidden admin-menu2'}>
            <li>
              <Link to={`${get('administration', slug)}/discussion?section=1`} activeClassName="active">
                <span>
                  <Translate value="administration.menu.language" />
                </span>
              </Link>
            </li>
          </ul>
        </li>
        <li className="menu-item">
          <Link to={`${get('administration', slug)}/landingPage`} activeClassName="active">
            <Translate value="administration.landingpage" />
          </Link>
        </li>
        <li className="menu-item">
          <Link to={`${get('administration', slug)}/resourcesCenter`} activeClassName="active">
            <Translate value="administration.resourcesCenter.menuTitle" />
          </Link>
        </li>
        {timeline
          ? timeline.map((phase, phaseIndex) => {
            return (
              <li className="menu-item" key={phaseIndex}>
                <Link
                  to={`${get('administration', slug)}${get('adminPhase', { ...slug, phase: phase.identifier })}`}
                  activeClassName="active"
                >
                  {phase.title.entries.map((entry, index) => {
                    if (entry['@language'] === locale) {
                      return (
                        <span key={index}>
                          <Translate value="administration.menu.phase" count={phaseIndex + 1} description={entry.value} />
                        </span>
                      );
                    }

                    return null;
                  })}
                </Link>
                {translations[locale].administration[phase.identifier] &&
                <ul className={phase.identifier === requestedPhase ? 'shown admin-menu2' : 'hidden admin-menu2'}>
                  {Object.keys(translations[locale].administration[phase.identifier]).map((index) => {
                    const section = translations[locale].administration[phase.identifier][index];
                    return (
                      <li key={index}>
                        <Link
                          to={`${get('administration', slug)}${get('adminPhase', {
                            ...slug,
                            phase: phase.identifier
                          })}?section=${parseInt(index, 10) + 1}`}
                          activeClassName="active"
                        >
                          {section}
                        </Link>
                      </li>
                    );
                  })}
                </ul>}
              </li>
            );
          })
          : null}
      </ul>
    );
  }
}

export default Menu;