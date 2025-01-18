const { Client } = require('pg')
const sign = require("./module/sign");
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const fastify = require('fastify')({
  logger: {
    level: 'info',
    file: path.join(logsDir, 'app.log')
  }
});
fastify.register(require('@fastify/formbody'));
fastify.register(require('@fastify/cors'), {
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})


fastify.register(require('@fastify/rate-limit'),
  {
    global: false, 
    keyGenerator: (request) => {
      let param = sign(request.headers.xvk);
      if (param) {
        request.sign = param;
        return param.vk_user_id;
      } else { return "undefined" }
    },
    errorResponseBuilder: () => { return undefined },
  });

fastify.register(require('fastify-easy-route'));

const logErrorToFile = (error) => {
  const logPath = path.join(logsDir, 'error.log');
  const logMessage = `${new Date().toISOString()} - ERROR: ${error.stack || error}\n`;
  fs.appendFileSync(logPath, logMessage);
};

const start = async () => {
  try {
    fastify.listen({
      port: parseInt(process.env.PORT) || 80,
      host: process.env.IP || '0.0.0.0'
    }, (error) => {
      if (error) {
        logErrorToFile(error);
        fastify.log.error(error);
        process.exit(1);
      }
      console.log(`Server listening on http://${process.env.IP || '0.0.0.0'}:${process.env.PORT || 80}`)
    })

    const client = new Client({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT) || 5432
    })

    try {
      await client.connect()
      fastify.pg = client
      fastify.log.info('Connected to PostgreSQL')
    } catch (err) {
      console.error('PostgreSQL connection error:', err)
    }
    

  } catch (error) {
    logErrorToFile(error);
    fastify.log.error(error);
  }
}

start()
