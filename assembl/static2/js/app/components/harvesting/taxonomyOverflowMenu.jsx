// @flow
import * as React from 'react';
import { Popover, Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import { extractNatures, extractActions, NatureIcons, ActionIcons } from '../../utils/extractQualifier';

type TaxonomyOverflowMenuProps = {
  handleClick: Function,
  extractNature: ?string,
  extractAction: ?string,
  onCloseClick: Function,
  top: number
};

type taxonomyOverflowMenuState = {
  nature: ?string,
  action: ?string
};

class TaxonomyOverflowMenu extends React.Component<TaxonomyOverflowMenuProps, taxonomyOverflowMenuState> {
  static defaultProps = {
    extractNature: null,
    extractAction: null
  };

  static defaultProps = {
    extractNature: null,
    extractAction: null
  };

  constructor(props: TaxonomyOverflowMenuProps) {
    super(props);
    const { extractNature, extractAction } = this.props;
    this.state = {
      nature: extractNature,
      action: extractAction
    };
    // $FlowFixMe
    this.menuRef = React.createRef();
  }

  componentDidMount() {
    // $FlowFixMe
    this.props.innerRef(this.menuRef.current);
  }

  handleTaxonomySelection = (category: string, qualifier: string) => {
    const { nature, action } = this.state;
    if (category === 'nature') {
      return nature === qualifier ? this.setState({ nature: null }) : this.setState({ nature: qualifier });
    }
    return action === qualifier ? this.setState({ action: null }) : this.setState({ action: qualifier });
  };

  render() {
    const { nature, action } = this.state;
    const { top } = this.props;
    return (
      <Popover id="taxonomy" className="taxonomy-menu overflow-menu" style={{ top: `${top}px` }}>
        {/* $FlowFixMe */}
        <div ref={this.menuRef}>
          <div className="pointer taxonomy-label taxonomy-label-border">
            <Translate value="harvesting.move" />
          </div>
          <div className="assembl-icon-cancel" onClick={this.props.onCloseClick} />
          <div className="taxonomy-category">
            <Translate value="harvesting.qualifyNature" />
          </div>
          <div className="pointer">
            {extractNatures.map(n => (
              <div
                onClick={() => this.handleTaxonomySelection('nature', n.qualifier)}
                key={n.qualifier}
                className={classnames('taxonomy-label', { active: nature === n.qualifier })}
              >
                <NatureIcons qualifier={n.qualifier} />
                <div className="nature-label">
                  <Translate value={n.label} />
                </div>
              </div>
            ))}
          </div>
          <div className="taxonomy-category">
            <Translate value="harvesting.qualifyAction" />
          </div>
          <div className="pointer">
            {extractActions.map(a => (
              <div
                onClick={() => this.handleTaxonomySelection('action', a.qualifier)}
                key={a.qualifier}
                className={classnames('taxonomy-label', { active: action === a.qualifier })}
              >
                <ActionIcons qualifier={a.qualifier} backgroundColor="#fff" color="#000" />
                <div className="action-label">
                  <Translate value={a.label} />
                </div>
              </div>
            ))}
          </div>
          <div className="center-flex">
            <Button key="validate" onClick={() => this.props.handleClick(this.state)} className="button-taxonomy button-dark">
              <Translate value="validate" />
            </Button>
          </div>
        </div>
      </Popover>
    );
  }
}

export default TaxonomyOverflowMenu;