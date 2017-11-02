import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';

import * as actions from '../../../actions/adminActions/resourcesCenter';
import EditResourceForm from './editResourceForm';

export const createResourceTooltip = (
  <Tooltip id="createResourceTooltip">
    <Translate value="administration.resourcesCenter.createResource" />
  </Tooltip>
);

const ManageResourcesForm = ({ createResource, resources }) => {
  return (
    <div>
      {resources.map((resource) => {
        return <EditResourceForm key={resource.get('id')} {...resource.toJS()} />;
      })}
      <OverlayTrigger placement="top" overlay={createResourceTooltip}>
        <div onClick={createResource} className="plus margin-l">
          +
        </div>
      </OverlayTrigger>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { resourcesInOrder, resourcesById } = state.admin.resourcesCenter;
  return {
    resources: resourcesInOrder.map((id) => {
      return resourcesById.get(id);
    })
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createResource: () => {
      const newId = Math.round(Math.random() * -1000000).toString();
      return dispatch(actions.createResource(newId));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageResourcesForm);