var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nrmlgn247appshare@gmail.com',
    pass: 'AppShare@12905@al'
  }
});

var mailOptions = {
  from: 'nrmlgn247appshare@gmail.com',
  to: 'nrmlgn247@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});