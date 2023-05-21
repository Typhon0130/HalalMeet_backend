import { env } from 'admin-bro'

const displayImg = props => {
  return (
    <div>
      <img style={{ width: 100, height: 100}} src={ env.API_URL + '/file/' + props.record.params.img} alt={props.record.params.img} />
    </div>
  );
};

export default displayImg