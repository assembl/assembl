import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { get } from '../../utils/routeMap';
import { getDiscussionSlug } from '../../utils/globalFunctions';

class Menu extends React.Component {
  render() {
    const slug = { slug: getDiscussionSlug() };
    const { timeline } = this.props.debate.debateData;
    const { locale, translations } = this.props.i18n;
    return (
      <ul className="admin-menu">
        <li className="menu-item">
          <Link to={`${get('administration', slug)}`}>
            <Translate value="administration.edition" />
          </Link>
        </li>
        <li className="menu-item">
          <Link to={`${get('administration', slug)}`}>
            <Translate value="administration.landingpage" />
          </Link>
        </li>
        {timeline.map((phase, phaseIndex) => {
          return (
            <li className="menu-item" key={phaseIndex}>
              <Link to={`${get('administration', slug)}${get('adminPhase', { ...slug, phase: phase.identifier })}`} activeClassName="active">
                {phase.title.entries.map((entry, index) => {
                  if (entry['@language'] === locale) {
                    return (
                      <span key={index}>Phase - {phaseIndex + 1} {entry.value}</span>
                    );
                  }
                })}
              </Link>
              {translations.fr.administration[phase.identifier] &&
                <ul className="admin-menu2">
                  {translations[locale].administration[phase.identifier].map((section, index) => {
                    return (
                      <li key={index}>
                        <Link to={`${get('administration', slug)}${get('adminPhase', { ...slug, phase: phase.identifier })}?section=${index+1}`} activeClassName="active">
                          {section[`section${index}`]}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              }
            </li>
          );
        })}
      </ul>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    i18n: state.i18n
  }
}

export default connect(mapStateToProps)(Menu);