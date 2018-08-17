// @flow
import classNames from 'classnames';
import * as React from 'react';
import { Col, Row, OverlayTrigger } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { thematicTooltip } from './tooltips';

export type Tab = {
  id: string,
  title: string
};

type Props = {
  bodyRowClassName: string,
  divClassName: string,
  renderBody: (Tab, number) => React.Node,
  tabs: Array<Tab>,
  type: string
};

type State = {
  activeIdx: number
};

class TabbedContent extends React.Component<Props, State> {
  static defaultProps = {
    bodyRowClassName: '',
    divClassName: ''
  };

  state = {
    activeIdx: 0
  };

  renderTabs() {
    const { tabs, type } = this.props;
    return tabs.map((tab, idx) => (
      <Col xs={12} md={Math.round(12 / tabs.length)} key={tab.id}>
        <OverlayTrigger placement="top" overlay={thematicTooltip(tab.title)}>
          <a
            className={classNames(
              {
                'tab-title-active': idx === this.state.activeIdx,
                'tab-title': idx !== this.state.activeIdx
              },
              'ellipsis'
            )}
            onClick={() => {
              this.setState({ activeIdx: idx });
            }}
          >
            {type === 'thematic' ? (
              <Translate count={idx + 1} value="debate.survey.thematicNumerotation" />
            ) : (
              <Translate count={idx + 1} value="administration.timelineAdmin.phase" />
            )}
          </a>
        </OverlayTrigger>
      </Col>
    ));
  }

  render() {
    const { bodyRowClassName, divClassName, tabs, renderBody } = this.props;
    const { activeIdx } = this.state;
    return (
      <div className={classNames('tabbed-content', divClassName)}>
        <Row>{this.renderTabs()}</Row>
        {tabs.map(
          (tab, idx) =>
            (idx === activeIdx ? (
              <Row className={classNames('tab-body', bodyRowClassName)} key={tab.id}>
                {renderBody(tab, idx)}
              </Row>
            ) : null)
        )}
      </div>
    );
  }
}

export default TabbedContent;