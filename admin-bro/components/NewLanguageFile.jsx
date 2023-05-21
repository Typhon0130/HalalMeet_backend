import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { env } from 'admin-bro'
import { Input, Box, Label, Button } from '@admin-bro/design-system'

const NewLanguageFile = props => {
  const [properties , setProperties] = useState([]);
  const [uploadedFile , setUploadedFile] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await axios.get(env.API_URL + '/admin/language-file-properties')
      setProperties(res.data)
    })()
  }, [])

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/xlsx/dist/xlsx.full.min.js";
    document.body.appendChild(script);
  }, [])

  function handleFile(e) {
    let files = e.target.files;
    let i, f;
    //Loop through files
    try {
      for (let i = 0, f = files[i]; i != files.length; ++i) {
        let reader = new FileReader();

        reader.onload = function (e) {
          let data = new Uint8Array(e.target.result);
          let arr = new Array();
          for (let i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
          let workbook = XLSX.read(arr.join(""), { type:'binary', cellText: true });
          let sheet_name_list = workbook.SheetNames;
          let sheetName = sheet_name_list[0]

          console.log('ROA', data)
          let roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: true, blankRows: false });
          console.log('ROA2', roa)
          if (roa.length > 0) {
            setUploadedFile(roa)
          }
        };
        reader.readAsArrayBuffer(f);
      }
    } catch (e) {
      console.log(e)
    }
  }

  const downloadLanguageFile = async () => {
    let ws = XLSX.utils.json_to_sheet(properties);
    console.log(ws)
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Internalization`);
    XLSX.writeFile(wb, `Internalization.xlsx`);
    console.log(wb)
  }

  const saveNewLanguageFile = async () => {
    await axios.post(env.API_URL + '/admin/new-language-file', uploadedFile)
    alert('Language file added.')
  }

  return (
    <div style={{ padding: '20px' }}>
      <Label style={{ fontSize: '25px', fontWeight: 800 }}>Step 1</Label>
      <Box style={{ display: 'flex', margin: '25px', width: '100%'}}>
        <Label style={{ fontSize: '20px', marginBottom: '10px' }}>Download the excel with all the Internalizations</Label>
      </Box>
      <Box style={{ display: 'flex', margin: '25px', width: '100%'}}>
        <Button variant="success" onClick={downloadLanguageFile}>Download Example</Button>
      </Box>
      <Label style={{ fontSize: '25px', fontWeight: 800 }}>Step 2</Label>
      <Box style={{ display: 'flex', margin: '25px', width: '100%'}}>
        <Label style={{ fontSize: '17px', marginBottom: '10px' }}>Edit the existing Language translations or add a new language as a new column in the excel. Each column thats not named i18nName or oldName will be added as a new translations. ALL THE PREVIOUS translations will be removed, and all will be reloaded from the excel.</Label>
      </Box>
      <Box style={{ display: 'flex', margin: '25px', width: '100%'}}>
        <input type="file" style={{width: "100%", padding: "5px"}} onChange={handleFile}/>
      </Box>
      <Label style={{ fontSize: '25px', fontWeight: 800 }}>Step 3</Label>
      <Box style={{ display: 'flex', margin: '25px', width: '100%'}}>
        <Label style={{ fontSize: '20px', marginBottom: '10px' }}>Click save to upload the file.</Label>
      </Box>
      <Box style={{ display: 'flex', margin: '25px', width: '100%'}}>
        <Button variant="success" disabled={uploadedFile.length <= 0} onClick={saveNewLanguageFile}>Save Language file</Button>
      </Box>
    </div>
  );
};

export default NewLanguageFile