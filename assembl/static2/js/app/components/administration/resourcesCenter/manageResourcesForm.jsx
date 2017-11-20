import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import { connect } from 'react-redux';

import * as actions from '../../../actions/adminActions/resourcesCenter';
import { createResourceTooltip } from '../../common/tooltips';
import EditResourceForm from './editResourceForm';

const ManageResourcesForm = ({ createResource, resources, selectedLocale }) => {
  return (
    <div>
      {resources.map((id) => {
        return <EditResourceForm key={id} id={id} locale={selectedLocale} />;
      })}
      <OverlayTrigger placement="top" overlay={createResourceTooltip}>
        <div
          onClick={() => {
            return createResource(resources.size + 1);
          }}
          className="plus margin-l"
        >
          +
        </div>
      </OverlayTrigger>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { resourcesInOrder, resourcesById } = state.admin.resourcesCenter;
  return {
    resources: resourcesInOrder.filter((id) => {
      return !resourcesById.get(id).get('toDelete');
    })
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createResource: (nextOrder) => {
      const newId = Math.round(Math.random() * -1000000).toString();
      return dispatch(actions.createResource(newId, nextOrder));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageResourcesForm);