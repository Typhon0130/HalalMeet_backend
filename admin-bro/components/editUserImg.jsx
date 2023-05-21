import { env} from 'admin-bro'
import { Input, Box, Label, Button, TextArea } from '@admin-bro/design-system'
import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';

const EditUserImg = props => {
  // props.record.params.img

  const [file, setFile] = useState('');
  const [progress, setProgess] = useState(0);
  const el = useRef();

  console.log(props.record.params)

  const handleChange = (e) => {
    setProgess(0)
    const file = e.target.files[0]; // accesing file
    console.log(file);
    setFile(file); // storing file
  }
  const uploadFile = () => {
    const formData = new FormData();
    formData.append('img', file); // appending file
    axios.post(env.API_URL + '/admin/user/' + props.record.params.id + '/change-image', formData)
      .then(res => {
        console.log(res);
      }).catch(err => console.log(err))
  }

  return (
    <Box style={{ marginTop: 20, marginBottom: 20 }}>
      <div>
        <div className="file-upload">
          <input type="file" ref={el} onChange={handleChange} />
        </div>
          {file && <div>
            <Button style={{ padding: "", marginTop: 10, width: "200px", cursor: "pointer" }} onClick={uploadFile} variant={'success'} >Upload Image</Button>
            <hr />
          </div>}
      </div>
    </Box>
  );
};

export default EditUserImg