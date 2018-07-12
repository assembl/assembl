// @flow
import classNames from 'classnames';
import * as React from 'react';
import { Col, Row } from 'react-bootstrap';

export type Tab = {
  id: string,
  title: string
};

type Props = {
  bodyRowClassName: string,
  divClassName: string,
  renderBody: (Tab, number) => React.Node,
  tabs: Array<Tab>
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
    const { tabs } = this.props;
    return tabs.map((tab, idx) => (
      <Col xs={12} md={Math.round(12 / tabs.length)} key={tab.id}>
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
          {tab.title}
        </a>
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