// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {ActivityHandler, MessageFactory} = require('botbuilder');
const {QnAMaker} = require('botbuilder-ai');

class ScreamBot extends ActivityHandler {
  constructor(configuration, qnaOptions) {
    super();
    if (!configuration) { throw new Error('[QnaMakerBot]: Missing parameter. configuration is required'); }
        // create a qnaMaker connector
    this.qnaMaker = new QnAMaker(configuration, qnaOptions);
    this.onMessage(async (context, next) => {
            // send user input to QnA Maker.
      const qnaResults = await this.qnaMaker.getAnswers(context);

            // Send back the QnA answer, if it exists
      if (qnaResults[0]) {
        await context.sendActivity(qnaResults[0].answer);
      } else {
                // If no answers were returned from QnA Maker, reply with blanket response.
        await context.sendActivity('What\'s that noise?');
      }
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      const welcomeText = 'Hello.';
      for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
        if (membersAdded[cnt].id !== context.activity.recipient.id) {
          await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
        }
      }
            // By calling next() you ensure that the next BotHandler is run.
      await next();
    });
  }
}

module.exports.ScreamBot = ScreamBot;
