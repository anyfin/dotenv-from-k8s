#!/usr/bin/env node
import prog from 'caporal';
import fs from 'fs';
import stream, { Readable } from 'stream';
import util from 'util';

const pkg = require('../package.json');
import { configParser, Ref } from './configParser';
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
  .option(
    '-x, --context <context_name>',
    'K8s context <context_name> from which you want to access the secrets and/or config maps',
    prog.STRING,
  )
  .action(function (args, options, logger) {
    async function main(): Promise<void> {
      let outStream: NodeJS.WritableStream = process.stdout;
      const refs: Ref[] = [];
      const overrides: Record<string, string> = {};
      let namespace = 'default';
      let context;

      if (options.input) {
        const parsed = await configParser(options.input);
        namespace = parsed.namespace;
        refs.push(...parsed.refs);
        Object.assign(overrides, parsed.overrides);
      }
      if (options.namespace) {
        namespace = options.namespace;
      }
      if (options.secret) {
        refs.push(...arrayfy(options.secret).map((secret) => ({ secretRef: { name: secret } })));
      }
      if (options.configmap) {
        refs.push(...arrayfy(options.configmap).map((configMap) => ({ configMapRef: { name: configMap } })));
      }
      if (options.out) {
        outStream = fs.createWriteStream(options.out, { encoding: 'utf8' });
      }
      if (options.context) {
        context = options.context;
      }

      const k8sApi = getK8sApi(context);
      const finalConfig = await getAndMergeSecretsAndConfigs(k8sApi, refs, overrides, namespace);
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
