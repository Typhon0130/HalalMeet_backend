import React,{ useState, useEffect } from 'react';
import axios from 'axios';
import { env } from 'admin-bro'
import { Input, Box, Label, Button, TextArea } from '@admin-bro/design-system'

const NewGooglePlaces = (props) => {
  const [selectedNotificationType, setSelectedNotificationType] = useState('EMAIL');
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedServiceArea, setSelectedServiceArea] = useState('ca');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [subject, changeSubject] = useState();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState();
  const [message, changeMessage] = useState();
  const [gender, setGender] = useState('MALE');

  const handleServiceAreaChange = (e) => {
    console.log('handleServiceAreaChange ', e.target.value)
    setSelectedServiceArea(e.target.value);
  }

  const handleNotificationTypeChange = (e) => {
    console.log('handleNotificationTypeChange ', e.target.value)
    setSelectedNotificationType(e.target.value);
  }

  const handleCityChange = (e) => {
    console.log('handleCityChange ', e.target.value)
    setSelectedCity(e.target.value);
  }

  const handleGenderChange = (e) => {
    console.log('handleGenderChange ', e.target.value)
    setGender(e.target.value);
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
      try {
        const resp = await axios.get(env.API_URL + '/admin/serve-cities')
        setCities(resp.data)
        setSelectedCity(resp.data[0])
      } catch (e) {
        console.log('ERROR LOADING CITY OPTIONS: ', e)
      }
      try {
        const resp = await axios.get(env.API_URL + '/admin/serve-custom-templates')
        setTemplates(resp.data)
        setSelectedTemplate(resp.data[0])
      } catch (e) {
        console.log('ERROR CUSTOM TEMPLATES: ', e)
      }
    })()

    return () => {
    }
  }, []);

  const handleSubject = (e) => {
    changeSubject(e.target.value);
  }

  const handleMessage = (e) => {
    changeMessage(e.target.value);
  }

  const submit = async () => {
      try {
        console.log(selectedServiceArea)
        console.log(message)
        console.log(selectedNotificationType)
        if (!selectedServiceArea || !selectedNotificationType) {
          alert('Service Area, Notification type is mandatory..')
          return;
        }
        console.log(subject)
        if ((selectedNotificationType === 'EMAIL' || selectedNotificationType === 'MOBILE_OS') && !subject) {
          alert('Subject is required when type is EMAIL OR MOBILE_OS')
          return;
        }
        await axios.post(env.API_URL + '/admin/create-new-notifications', { subject: subject, template: selectedTemplate, serviceArea: selectedServiceArea, type: selectedNotificationType, message: message, gender, city: selectedCity });
        alert('Notifications created. Redirecting...')
        window.location.href = env.BASE_URL + "/resources/Users";
      } catch(e) {
        console.log(e);
      }
  }

  return (
    <Box style={{ padding: "30px" }} className={'wrapper'}>
      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Select the type of Notification</Label>
        <Box style={{width: "100%"}}>
          <select style={{width: "100%", padding: "5px"}} name="type" value={selectedNotificationType} onChange={handleNotificationTypeChange}>
            <option style={{ padding: "5px" }} value="EMAIL">EMAIL</option>
            <option style={{ padding: "5px" }} value="SMS">SMS</option>
            <option style={{ padding: "5px" }} value="MOBILE_OS">MOBILE</option>
          </select>
        </Box>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Select Service Area</Label>
        <select style={{width: "100%", padding: "5px"}} name="rankby" value={selectedServiceArea} onChange={handleServiceAreaChange}>
          { serviceAreas && serviceAreas.map(e => {
            return <option key={e.iso} style={{ padding: "5px" }} value={e.iso}>{ e.iso }</option>
          })}
        </select>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Select city</Label>
        <select style={{width: "100%", padding: "5px"}} name="rankby" value={selectedCity} onChange={handleCityChange}>
          { cities && cities.map(e => {
            return <option key={e} style={{ padding: "5px" }} value={e}>{ e }</option>
          })}
        </select>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Select gender</Label>
        <Box style={{width: "100%"}}>
          <select style={{width: "100%", padding: "5px"}} name="gender" value={gender} onChange={handleGenderChange}>
            <option style={{ padding: "5px" }} value="MALE">MALE</option>
            <option style={{ padding: "5px" }} value="FEMALE">FEMALE</option>
          </select>
        </Box>
      </Box>

      { selectedNotificationType !== 'SMS' && (
        <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
          <Label style={{ textAlign: "center", width: "100%", margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }}>Subject</Label>
          <Input style={{width: "100%", padding: "5px"}} value={subject} onChange={handleSubject}/>
        </Box>
      )}

      { selectedNotificationType === 'EMAIL' && (
        <>
          <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
            <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Templates</Label>
            <select style={{width: "100%", padding: "5px"}} name="templates" value={selectedTemplate} onChange={(e) => { setSelectedServiceArea(e.target.value) }}>
              { templates && templates.map(e => {
                return <option key={e} style={{ padding: "5px" }} value={e}>{ e }</option>
              })}
            </select>
          </Box>
          <Box style={{margin: 20}}>
            <Label>The following variables are available: phoneNumber, email, firstName, lastName</Label>
            <Label>with the following syntax { '{variableName}' }, example { '{username}' }.</Label>
          </Box>
        </>
      )}

      {  selectedNotificationType !== 'EMAIL' && <Box
        style={{display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px"}}>
        <Label style={{
          textAlign: "center",
          width: "100%",
          margin: "15px 0 10px 0",
          fontWeight: "bolder",
          fontSize: "20px"
        }}>Message</Label>
        <TextArea rows={5} style={{width: "100%", padding: "5px"}} value={message} onChange={handleMessage}/>
      </Box>}

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Button variant={'success'} onClick={submit}>Send out Notifications</Button>
      </Box>

    </Box>
  );
};

export default NewGooglePlaces;
