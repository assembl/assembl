import React, { Component } from 'react';
import DatePicker from 'react-datepicker/lib/datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

const calendarImage = (
  <img
    style={{ width: 20, height: 20, marginLeft: 10 }}
    src="/static2/img/icone-calendrier.svg"
    role="presentation"
  />);

class DateRangeFilter extends Component {

  constructor(props) {
    super(props);
    this.state = {
      startDate: null,
      endDate: null
    };
    this.handleChangeStart = this.handleChangeStart.bind(this);
    this.handleChangeEnd = this.handleChangeEnd.bind(this);
    this.updateSearch = this.updateSearch.bind(this);
    this.isBeforeStartDate = this.isBeforeStartDate.bind(this);
    this.isAfterEndDate = this.isAfterEndDate.bind(this);
  }

  componentWillReceiveProps(props) {
    if (props.minValue !== this.props.minValue) {
      if (props.minValue === props.min || props.minValue === 0) {
        this.setState({ startDate: null });
      } else {
        this.setState({ startDate: moment(props.minValue) });
      }
    }
    if (props.maxValue !== this.props.maxValue) {
      if (props.maxValue === props.max || props.maxValue === 0) {
        this.setState({ endDate: null });
      } else {
        this.setState({ endDate: moment(props.maxValue) });
      }
    }
  }

  handleChangeStart(event) {
    this.setState({
      startDate: event
    }, this.updateSearch);
  }

  handleChangeEnd(event) {
    this.setState({
      endDate: event && event.endOf('day')
    }, this.updateSearch);
  }

  updateSearch() {
    const { startDate, endDate } = this.state;
    const { onFinished } = this.props;
    const newValues = {
      min: startDate && startDate.format('x'),
      max: endDate && endDate.format('x')
    };
    onFinished(newValues);
  }

  isBeforeStartDate(date) {
    if (!this.state.startDate) {
      return true;
    }

    return this.state.startDate <= date;
  }

  isAfterEndDate(date) {
    if (!this.state.endDate) {
      return true;
    }

    return date <= this.state.endDate;
  }

  render() {
    return (
      <div className="form-inline date-filter">
        <div className="form-group">
          <label htmlFor="date_from">Du</label>
          <DatePicker
            id="date_from"
            className="form-control sk-input-filter"
            // placeholderText="Select start date"
            isClearable
            filterDate={this.isAfterEndDate}
            selectsStart
            selected={this.state.startDate}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            onChange={this.handleChangeStart}
          />
          {calendarImage}
        </div>
        <div className="form-group">
          <label htmlFor="date_to">Au</label>
          <DatePicker
            id="date_to"
            className="form-control sk-input-filter"
            // placeholderText="Select end date"
            isClearable
            filterDate={this.isBeforeStartDate}
            selectsEnd
            selected={this.state.endDate}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            onChange={this.handleChangeEnd}
          />
          {calendarImage}
        </div>
      </div>
    );
  }
}

export default DateRangeFilter;