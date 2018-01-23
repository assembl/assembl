import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Timeline from '../navigation/timeline';

class DebateLink extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menuActive: false
    };
  }

  showMenu = () => {
    this.setState({ menuActive: true });
  };

  hideMenu = () => {
    this.setState({ menuActive: false });
  };

  render() {
    const { identifier, children, to, className, activeClassName, dataText } = this.props;
    const { menuActive } = this.state;
    return (
      <div className={classNames('debate-link', { active: menuActive })} onMouseOver={this.showMenu} onMouseLeave={this.hideMenu}>
        <Link to={to} className={className} activeClassName={activeClassName} data-text={dataText}>
          {children}
        </Link>
        <div className="header-container">
          <section className="timeline-section" id="timeline">
            <div className="max-container">
              <Timeline showNavigation identifier={identifier} />
            </div>
          </section>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale
});

export default connect(mapStateToProps)(DebateLink);