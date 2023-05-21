const AWS = require('aws-sdk');
const path = require("path");
const fs = require('fs');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const ses = new AWS.SES({apiVersion: '2010-12-01'});

const sendEmail = (to, subject, message, from) => {
  const params = {
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: message
        },
        /* replace Html attribute with the following if you want to send plain text emails.
        Text: {
            Charset: "UTF-8",
            Data: message
        }
     */
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    ReturnPath: from ? from : process.env.DEFAULT_EMAIL_SENDER,
    Source: from ? from : process.env.DEFAULT_EMAIL_SENDER,
  };

  // ses.sendEmail(params, (err, data) => {
  //   if (err) {
  //     return console.log(err, err.stack);
  //   } else {
  //     console.log("Email sent.", data);
  //   }
  // });
};

const sendEmailWithTemplateToUser = async (eventName, user, template) => {
  const templatesPath = path.join(__dirname, "/../public/emailTemplates");
  let event
  if (eventName !== 'CUSTOM') {
    event = await db.Event.findOne({ where: { eventName } })
  } else {
    event = await db.Event.findOne({ where: { templateName: template } })
  }
  if (event) {
    fs.readFile(templatesPath + '/' + event.templateName, (err, data) => {
      if (err) return err;
      let template = data.toString()
      template = template.replace('{user.firstName}', user.firstName)
      template = template.replace('{user.lastName}', user.lastName)
      template = template.replace('{user.email}', user.email)
      sendEmail(user.email, 'Welcome to HalalMeet!', template, null)
    })
  }
}

module.exports = {
  sendEmail,
  sendEmailWithTemplateToUser
}
