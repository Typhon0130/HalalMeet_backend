import { env } from 'admin-bro'
import React,{ useState, useEffect, useRef } from 'react';

const displaySelfie = props => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (props.record.params['selfie.0']) {
      console.log(env.API_URL + '/file/' + props.record.params['selfie.0'])
      setUrl(env.API_URL + '/file/' + props.record.params['selfie.0'])
    }
  }, [props])

  return (
    <div>
      { props.record.params['selfie.0'] &&
        <img style={{ width: 100, height: 100}} src={ url} alt={'selfie'} />
      }
    </div>
  );
};

export default displaySelfie