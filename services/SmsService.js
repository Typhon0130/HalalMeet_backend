const AWS = require('aws-sdk');

const sendSms = async (number, text) => {
 try {
   console.log(number)
   console.log(text)
   if (process.env.NODE_ENV === 'production') { // replace add with 'production'
     const asd = await new AWS.SNS({ apiVersion: '2010-03-31' }).publish(
       {
         Message: text,
         PhoneNumber: number,
         MessageAttributes: {
           'AWS.SNS.SMS.SenderID': {
             'DataType': 'String',
             'StringValue': "HalalMeet"
           }
         }

       }).promise();
     console.log('SENT SMS: ', asd)
   }
   return true
 } catch (e) {
   console.log(e)
   return false
 }
}

module.exports = {
  sendSms
}