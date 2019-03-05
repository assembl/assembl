// @flow
import classNames from 'classnames';
import * as React from 'react';
import { Col, Row, OverlayTrigger } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { hiddenTooltip } from './tooltips';

export type Tab = {
  id: string,
  title: string,
  index: number
};

type Props = {
  bodyRowClassName: string,
  divClassName: string,
  renderBody: (Tab, number) => React.Node,
  renderTooltip: string => React.Node,
  tabTitleMsgId: string,
  tabs: Array<Tab>
};

type State = {
  activeIdx: number
};

class TabbedContent extends React.Component<Props, State> {
  static defaultProps = {
    bodyRowClassName: '',
    divClassName: '',
    renderTooltip: () => hiddenTooltip
  };

  state = {
    activeIdx: 0
  };

  renderOverlay = (tab: Tab) => (tab.title ? this.props.renderTooltip(tab.title) : hiddenTooltip);

  renderTabs() {
    const { tabTitleMsgId, tabs } = this.props;
    return tabs.map((tab, idx): React.Element<Col> => (
      <Col xs={12} md={Math.round(12 / tabs.length)} key={tab.id}>
        <OverlayTrigger placement="top" overlay={this.renderOverlay(tab)}>
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
            <Translate count={idx + 1} value={tabTitleMsgId} />
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
        <Row className="tabs-section">{this.renderTabs()}</Row>
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