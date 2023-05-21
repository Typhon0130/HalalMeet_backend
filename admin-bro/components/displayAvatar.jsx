import { env } from 'admin-bro'

const displayAvatar = props => {
  return (
    <div>
      <img style={{ width: 100, height: 100}} src={ env.API_URL + '/file/' + props.record.params.avatar} alt={props.record.params.avatar} />
    </div>
  );
};

export default displayAvatar