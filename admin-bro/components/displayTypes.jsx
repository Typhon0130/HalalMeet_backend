const displayTypes = props => {

  return (<div>
    {
      props.record.params['types.0'] ? props.record.params['types.0'] : null + ', ' +
      props.record.params['types.1'] ? props.record.params['types.1'] : null + ', ' +
      props.record.params['types.2'] ? props.record.params['types.2'] : null + ', ' +
      props.record.params['types.3'] ? props.record.params['types.3'] : null + ', ' +
      props.record.params['types.4'] ? props.record.params['types.4'] : null + ', ' +
      props.record.params['types.5'] ? props.record.params['types.5'] : null + ', ' +
      props.record.params['types.6'] ? props.record.params['types.6'] : null + ', ' +
      props.record.params['types.7'] ? props.record.params['types.7'] : null + ', ' +
      props.record.params['types.8'] ? props.record.params['types.8'] : null + ', ' +
      props.record.params['types.9'] ? props.record.params['types.9'] : null + ', ' +
      props.record.params['types.10'] ? props.record.params['types.10'] : null + ', '
    }
  </div>);
};

export default displayTypes