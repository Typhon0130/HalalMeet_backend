import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { env } from 'admin-bro'
import { Input, Box, Label, Button } from '@admin-bro/design-system'

const GenerateFakeUsers = () => {
  const [selectedServiceArea, setSelectedServiceArea] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [gender, setGender] = useState('FEMALE');
  const [fakeUsers, setFakeUsers] = useState([]);
  const [highlights, setHighlights]= useState([]);
  const [countries, setCountries]= useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  function handleFile(e) {
    let files = e.target.files;
    let i, f;
    //Loop through files
    for (let i = 0, f = files[i]; i != files.length; ++i) {
      let reader = new FileReader();
      let name = f.name;
      reader.onload = function (e) {
        let data = e.target.result;
        let workbook = XLSX.read(data, { type: 'binary' });
        let sheet_name_list = workbook.SheetNames;
        sheet_name_list.forEach(function (y) { /* iterate through sheets */
          let roa = XLSX.utils.sheet_to_json(workbook.Sheets[y]);
          if (roa.length > 0) {
            if (y === 'Users') {
              setFakeUsers(roa)
            } else if (y === 'Countries') {
              setCountries(roa)
            }
          }
        });
      };
      reader.readAsArrayBuffer(f);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const resp = await axios.get(env.API_URL + '/user/me/change-location/service-areas')
        setServiceAreas(resp.data)
        setSelectedServiceArea(resp.data[0].iso)
      } catch (e) {
        console.log('ERROR LOADING SERVICE AREAS: ', e)
      }
    })()
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.7.7/xlsx.core.min.js";
    document.body.appendChild(script);

    setTimeout(() => {
      setScriptLoaded(true); // Todo
    }, 1000);
  }, [])

  const handleServiceAreaChange = (e) => {
    setSelectedServiceArea(e.target.value);
  }

  const submit = async () => {
      try {
        if (!selectedServiceArea || !fakeUsers.length > 0) {
          alert('Please fill in all the fields.')
          return;
        }
        await axios.post(env.API_URL + '/admin/generate-fake-users', { users: fakeUsers, gender, highlights, countries, serviceAreaName: selectedServiceArea});
        alert('Finished generating fake users');
        window.location.href =  env.BASE_URL + "/resources/Users";
      } catch(e) {
        console.log(e);
      }
  }

  return (
    <Box style={{ padding: "30px" }} className={'wrapper'}>
      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Select Service Area</Label>
        <select style={{width: "100%", padding: "5px"}} name="rankby" value={selectedServiceArea} onChange={handleServiceAreaChange}>
          { serviceAreas && serviceAreas.map(e => {
            return <option key={e.id} style={{ padding: "5px" }} value={e.id}>{ e.iso }</option>
          })}
        </select>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Gender</Label>
        <select style={{width: "100%", padding: "5px"}} name="rankby" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option style={{ padding: "5px" }} value={'MALE'}>MALE</option>
            <option style={{ padding: "5px" }} value={'FEMALE'}>FEMALE</option>
        </select>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="maxprice">Upload the excel containing fake users by clickin on the input</Label>
        <input type="file" style={{width: "100%", padding: "5px"}} onChange={handleFile}/>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }}>You have added {fakeUsers.length} users.</Label>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Button style={{ padding: "10px", width: "100%", cursor: "pointer" }} variant={'success'}  onClick={submit}>Generate Fake Users</Button>
      </Box>
    </Box>
  );
};

export default GenerateFakeUsers;
