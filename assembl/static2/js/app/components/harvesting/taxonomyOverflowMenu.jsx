// @flow
import * as React from 'react';
import { Popover, Button, Overlay } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import { extractNatures, extractActions, NatureIcons, ActionIcons } from '../../utils/extractQualifier';

type Props = {
  handleClick: Function,
  extractNature: ?string,
  extractAction: ?string,
  onCloseClick: Function,
  target: HTMLElement
};

type State = {
  nature: ?string,
  action: ?string
};

const CATEGORIES = {
  action: 'action',
  nature: 'nature'
};

class TaxonomyOverflowMenu extends React.Component<Props, State> {
  static defaultProps = {
    extractNature: null,
    extractAction: null
  };

  constructor(props: Props) {
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
    const extractCategory = category === CATEGORIES.nature ? nature : action;
    this.setState({ [category]: extractCategory !== qualifier ? qualifier : null });
  };

  render() {
    const { nature, action } = this.state;
    const { onCloseClick, handleClick, target } = this.props;
    return (
      <Overlay show target={target} placement="bottom">
        <Popover id="taxonomy" className="harvesting-menu overflow-menu">
          {/* $FlowFixMe */}
          <div ref={this.menuRef}>
            <div className="pointer taxonomy-label taxonomy-label-border">
              <Translate value="harvesting.move" />
            </div>
            <div className="assembl-icon-cancel" onClick={onCloseClick} />
            <div className="taxonomy-category">
              <Translate value="harvesting.qualifyNature" />
            </div>
            <div className="pointer">
              {extractNatures.map(n => (
                <div
                  onClick={() => this.handleTaxonomySelection(CATEGORIES.nature, n.qualifier)}
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
                  onClick={() => this.handleTaxonomySelection(CATEGORIES.action, a.qualifier)}
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
              <Button key="validate" onClick={() => handleClick(this.state)} className="button-taxonomy button-dark">
                <Translate value="validate" />
              </Button>
            </div>
          </div>
        </Popover>
      </Overlay>
    );
  }
}

export default TaxonomyOverflowMenu;