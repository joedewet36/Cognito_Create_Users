    require('./config');
    const cloudant = require('./cloudant_nano');
    const helper = require('./helper');
    const options = {
      UserPoolId: '{Cognito User Pool ID}', // We can make this configurable
      ClientId: '{Cognito ClientID}' // We can make this configurable
    };

    const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

    const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
    const AWS = require('aws-sdk');
    var CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider(options);
    AWS.config.update({
      region: aws_region,
      accessKeyId: aws_accesskey ,
      secretAccessKey: "{AWS secretAccessKey}"
    });
    var getUserPool = async function (options) {
      if (!userPool) {
        userPool = new AmazonCognitoIdentity.CognitoUserPool(options);
      }
      return userPool;
    };
    var cognitoCreatedUser = {};
    const registerUser = async (cand,isAdmin) => {
      var defaultPwd = Math.random().toString(36).slice(-8) + helper.randomCapsString(1) + helper.randomSymbol(1) + helper.randomNumberString(1);
      if(isAdmin){

        defaultPwd = '{adminPw}';
      }
      
      let currentTime = Math.floor(new Date().getTime() / 1000);
      var cname = helper.isNullOrWhitespace(cand.forename) && helper.isNullOrWhitespace(cand.surname) ? ' ' : cand.forename + ' ' + cand.surname;
      cname = helper.isNullOrWhitespace(cand.forename) && !helper.isNullOrWhitespace(cand.surname) ? cand.surname : cname;
      cname = !helper.isNullOrWhitespace(cand.forename) && helper.isNullOrWhitespace(cand.surname) ? cand.forename : cname;
      cname = cname == ' ' ? cand.email : cname;

      var candidate_info = 
      {
        last_access_time: currentTime,
      }
      let params = {
        UserPoolId: options.UserPoolId, // From Cognito dashboard "Pool Id"
        Username: cand.email,
        MessageAction: 'SUPPRESS', // Do not send welcome email
        TemporaryPassword: defaultPwd,
        UserAttributes: [{
            Name: 'email',
            Value: cand.email
          }
         ,
          {
            Name: 'custom:candidate_info',
            Value: JSON.stringify(candidate_info)
          },
          {
            // Don't verify email addresses
            Name: 'email_verified',
            Value: 'true'
          }
        ]
      };
      const cognito = new AWS.CognitoIdentityServiceProvider(options);
      return cognito.adminCreateUser(params).promise()
        .then((data) => {
          // We created the user above, but the password is marked as temporary.
          // We need to set the password again. Initiate an auth challenge to get
          // started.
          //cognitoCreatedUser = data.User;
          console.log(data);
          let params = {
            AuthFlow: 'ADMIN_NO_SRP_AUTH',
            ClientId: options.ClientId, // From Cognito dashboard, generated app client id
            UserPoolId: options.UserPoolId,
            AuthParameters: {
              USERNAME: cand.email,
              PASSWORD: defaultPwd
            }
          };
          return cognito.adminInitiateAuth(params).promise();
        })
        .then((data) => {
          console.log(data);
          // We now have a proper challenge, set the password permanently.
          let challengeResponseData = {
            USERNAME: cand.email,
            NEW_PASSWORD: defaultPwd,
          };

          let params = {
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ClientId: options.ClientId,
            UserPoolId: options.UserPoolId,
            ChallengeResponses: challengeResponseData,
            Session: data.Session
          };
          return cognito.adminRespondToAuthChallenge(params).promise();
        })
        .then((data) => {
          console.log(data);
          return data;
        });
    };

    async function createUsers() {

      var candidates = await cloudant.getCandidates(mart);
      var retCognitoUser = {};
      var adminUser = {email : 'cloudhireats@gmail.com',forename : "Cloudhire", surname : "Admin"};
      retCognitoUser = await registerUser(adminUser,true);
      
      console.log("Cognito Admin User created");
      for (var j = 0; j < candidates.length; j++) {
        if (candidates[j].value.email != undefined || candidates[j].value.email != null) {
          retCognitoUser = await registerUser(candidates[j].value,false);
          console.log("Cognito User created");
        }

      }
    }

    createUsers();