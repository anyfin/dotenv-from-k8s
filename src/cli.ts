#!/usr/bin/env node
import prog, { parse } from 'caporal';
import fs from 'fs';
import stream, { Readable } from 'stream';
import util from 'util';

const pkg = require('../package.json');
import { configParser } from './configParser';
import { getAndMergeSecretsAndConfigs, getK8sApi } from './k8s';
import { arrayfy, convertJsonToPropertiesFile } from './utils';

const pipeline = util.promisify(stream.pipeline);

prog
  .name(pkg.name)
  .version(pkg.version)
  .description(pkg.description)
  .bin('dotenv-from-k8s')
  .help(
    `
Basic example: 
---------------
dotenv-from-k8s -c api-config -o .env 
or 
dotenv-from-k8s -c api-config > .env

Advanced example:
----------------
dotenv-from-k8s -s api-secrets -s api-secrets2 -c api-config -c api-config2 -n default > .env

Config file example:
--------------------
cat > env-from.yaml <<EOL

namespace: default
envFrom:
  - secretRef:
      name: app-secrets
  - configMapRef:
      name: app-config

EOL

dotenv-from-k8s -i env-from.yaml -o .env


Config file example with overrides:
-----------------------------------
cat > env-from.yaml <<EOL

namespace: default
envFrom:
  - secretRef:
      name: app-secrets
  - configMapRef:
      name: app-config
overrides:
    HELLO: WORLD
    ANOTHER_KEY: ANOTHER_VALUE

EOL

dotenv-from-k8s -i env-from.yaml -o .env
  `,
  )
  .option('-i, --input', 'Input configuration file')
  .option('-o, --out', 'Output env file name, defaults to stdout')
  .option('-s, --secret <secret_name>', 'K8s <secret_name> from which you want to generate env file', prog.REPEATABLE)
  .option('-c, --configmap <config_map>', 'K8s <config_map> from which you want to generate env file', prog.REPEATABLE)
  .option(
    '-n, --namespace <name_space>',
    'K8s <name_space> from which you want to access the secrets and/or config maps',
    prog.STRING,
  )
  .action(function (args, options, logger) {
    async function main(): Promise<void> {
      const k8sApi = getK8sApi();

      let outStream: NodeJS.WritableStream = process.stdout;
      const secrets: string[] = [];
      const configMaps: string[] = [];
      const overrides: Record<string, string> = {};
      let namespace = 'default';

      if (options.input) {
        const parsed = await configParser(options.input);
        namespace = parsed.namespace;
        secrets.push(...parsed.secrets);
        configMaps.push(...parsed.configMaps);
        Object.assign(overrides, parsed.overrides);
      }
      if (options.namespace) {
        namespace = options.namespace;
      }
      if (options.secret) {
        secrets.push(...arrayfy(options.secret));
      }
      if (options.configmap) {
        configMaps.push(...arrayfy(options.configmap));
      }
      if (options.out) {
        outStream = fs.createWriteStream(options.out, { encoding: 'utf8' });
      }

      const finalConfig = await getAndMergeSecretsAndConfigs(k8sApi, secrets, configMaps, overrides, namespace);
      const propertiesFile = convertJsonToPropertiesFile(finalConfig);
      const propFileStream = Readable.from(propertiesFile);
      await pipeline(propFileStream, outStream);
    }

    main().catch((err) => {
      logger.error('Invalid input! ', err);
      process.exit(-1);
    });
  });

prog.parse(process.argv);
