// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const path = require('path');

const dotenv = require('dotenv');
const {ApplicationInsightsTelemetryClient, TelemetryInitializerMiddleware} = require('botbuilder-applicationinsights');
const {TelemetryLoggerMiddleware} = require('botbuilder-core');
const restify = require('restify');
const {BotFrameworkAdapter, NullTelemetryClient} = require('botbuilder');
const appInsights = require('applicationinsights');

const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({path: ENV_FILE});

// This bot's main dialog
const {ScreamBot} = require('./bot');

// Create HTTP server
const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\n${ server.name } listening to ${ server.url }`);
  console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
  console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
  channelService: process.env.ChannelService,
  openIdMetadata: process.env.BotOpenIdMetadata
});

// Map knowledge base endpoint values from .env file into the required format for `QnAMaker`
const configuration = {
  knowledgeBaseId: process.env.QnAKnowledgebaseId,
  endpointKey: process.env.QnAAuthKey,
  host: process.env.QnAEndpointHostName,
  welcome: process.env.WelcomeText
};

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
  console.error(`\n [onTurnError] unhandled error: ${ error }`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    'OnTurnError Trace',
    `${ error }`,
    'https://www.botframework.com/schemas/error',
    'TurnError'
  );

    // Send a message to the user
  await context.sendActivity('The bot encountered an error or bug.');
};

// Set the onTurnError for the singleton BotFrameworkAdapter
adapter.onTurnError = onTurnErrorHandler;

// Add telemetry middleware to the adapter middleware pipeline
const telemetryClient = getTelemetryClient(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
const telemetryLoggerMiddleware = new TelemetryLoggerMiddleware(telemetryClient);
const initializerMiddleware = new TelemetryInitializerMiddleware(telemetryLoggerMiddleware);
adapter.use(initializerMiddleware);

appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true, true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .setSendLiveMetrics(false)
  .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)
  .start();

// Create the main dialog
const screamBot = new ScreamBot(configuration, {telemetryClient});

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
    await screamBot.run(context);
  });
});

// Listen for Upgrade requests for Streaming.
server.on('upgrade', (req, socket, head) => {
  const streamingAdapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
  });
  streamingAdapter.onTurnError = onTurnErrorHandler;
  streamingAdapter.useWebSocket(req, socket, head, async (context) => {
        // After connecting via WebSocket, run this logic for every request sent over the WebSocket connection
    await screamBot.run(context);
  });
});

// Creates a new TelemetryClient based on a instrumentation key
function getTelemetryClient(instrumentationKey) {
  if (instrumentationKey) {
    return new ApplicationInsightsTelemetryClient(instrumentationKey);
  }
  return new NullTelemetryClient();
}
