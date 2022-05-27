import generatePdf from './pdf-generator/index.js';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import postmark from 'postmark';
import morgan from 'morgan';

//const express = require("express");
//const cors = require("cors");
//const morgan = require("morgan");
//const axios = require("axios").default;
//const bodyParser=require("body-parser");
//const postmark =require("postmark");
//require("dotenv").config();
//const generatePdf=require(// from './pdf-generator/index.js';

const app = express();
// create application/json parser
var jsonParser = bodyParser.json({ limit: "50mb" });
app.use(bodyParser.urlencoded({ extended: true }));

// const PORT = process.env.PORT || 80;
const PORT = process.env.PORT || 3001;
const POSTMARK_TOKEN = process.env.POSTMARK_TOKEN;
const TEMPLATE_ID = 28077805;
const SENDER_EMAIL = 'emuca@emuca.com';
const SERVER_TOKEN = "c69c148b-2e0b-4773-87bd-a08727307b17";
const client = new postmark.ServerClient(SERVER_TOKEN);


//digitize Code
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});


app.use(morgan("dev"));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded());

app.get("/api/health", (req, res) => {
  res.status(200).send({ message: "server healthy!" });
});

app.get('/', (req, res) => {

    
  res.send('Welcome to Make REST API Calls In updated Express!')

})

app.post("/api/email", async (req, res) => {
  const data = req.body;
  const response = axios.post(
    "https://api.postmarkapp.com/email/withTemplate/",
    data,
    {
      "X-Postmark-Server-Token": POSTMARK_TOKEN,
    }
  );
  if (response.status !== 200)
    res.status(500).json({ message: "error connecting to postmark" });
  res.status(200).send(response.data);
});

//Digitize Code
app.post('/sendEmailWithTemplate', jsonParser, (req, res) => {


  const response = {
      message: 'Something error',
      status: false

  }

  const recieverEmail = req.body.recieverEmail;
  const firstName = req.body.first_name;

  if(!recieverEmail){
      response['message'] = 'Please give reciever email';
      res.send(response);
      return false;
  }

  if(!firstName){
      response['message'] = 'Please give first name of reciever';
      res.send(response);
      return false;
  }
  // const attachments = req.body.Attachments ;

  client.sendEmailWithTemplate({
      TemplateId:TEMPLATE_ID,
      From: SENDER_EMAIL,
      To: recieverEmail,
      TemplateModel: {
        "person": {
            "first_name": firstName,
            }
      },
      // Attachments: attachments,
      // "Bcc": SENDER_EMAIL,
  }, function(error, data) {
      if(error) {
          console.error("Unable to send via postmark: " + error.message);
          response['message'] = 'Unable to the email'
          res.send(response);
      }else{

        if(data.Message != 'OK'){
          response['message'] = 'Unable to the email'
          res.send(response);
          return false;
        }

          console.log('data>>>>>>>', data)
          response['data'] = {
              message: data.Message,
              messageID: data.MessageID,
              recieverEmail: data.To
          }
          response['status'] = true;
          res.send(response);
          return false;
      }
      
  });
});

//function to get PDF
app.post('/api/pdf/:template',jsonParser, async (req, res) => {
  if (!req.body) return res.status(422).send();
  if (!req.params.template)
    return res.status(422).send({ message: 'missing PDF template' });

  const template = req.params.template;
  if (!(template === 'emuca') )
    return res.status(422).send({ message: 'Template not found', status: false });

  try {
    const pdf = await generatePdf(req.params.template, req.body);
    res.set(
      Object.assign(
        { 'Content-type': 'application/pdf' },
        req.query.download === 'true'
          ? {
              'Content-Disposition': `attachment;filename=${
                req.query.filename || 'threekit-configuration.pdf'
              }`,
            }
          : {}
      )
    );
    res.end(pdf);
  } catch (e) {
    console.log(e);
    res.status(422).send(e);
  }
});

//function to get PDF
app.get('/api/pdf/:template',jsonParser, async (req, res) => {
  // if (!req.body) return res.status(422).send();
  if (!req.params.template)
    return res.status(422).send({ message: 'missing PDF template' });

  const template = req.params.template;
  if (!(template === 'emuca') )
    return res.status(422).send({ message: 'Template not found', status: false });

  try {
    const pdf = await generatePdf(req.params.template);
    res.set(
      Object.assign(
        { 'Content-type': 'application/pdf' },
        req.query.download === 'true'
          ? {
              'Content-Disposition': `attachment;filename=${
                req.query.filename || 'threekit-configuration.pdf'
              }`,
            }
          : {}
      )
    );
    res.end(pdf);
  } catch (e) {
    console.log(e);
    res.status(422).send(e);
  }
});


app.listen(PORT, () => console.log("listening on port: ", PORT));
