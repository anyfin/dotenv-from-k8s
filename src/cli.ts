#!/usr/bin/env node
import prog from 'caporal';

import { getAndMergeSecretsAndConfigs, getK8sApi } from './k8s';
import { convertJsonToPropertiesFile } from './utils';

prog
  .name('k8s2dotenv')
  .version('1.0.0')
  .bin('k8s2dotenv')
  .description('Merges and coverts secrets and configmaps to a env properties file')
  .option('-s, --secret <secret_name>', 'K8s <secret_name> from which you want to generate env file', prog.REPEATABLE)
  .option('-c, --configmap <config_map>', 'K8s <config_map> from which you want to generate env file', prog.REPEATABLE)
  .option(
    '-n, --namespace <name_space>',
    'K8s <name_space> from which you want to access the secrets and/or config maps',
    prog.STRING,
  )
  .action(function (args, options, logger) {
    const k8sApi = getK8sApi();

    let secrets: string[] = [];
    let configMaps: string[] = [];

    if (options.secret) {
      secrets = Array.isArray(options.secret) ? options.secret : [options.secret];
    }
    if (options.configmap) {
      configMaps = Array.isArray(options.configmap) ? options.configmap : [options.configmap];
    }
    async function main(): Promise<void> {
      const finalConfig = await getAndMergeSecretsAndConfigs(k8sApi, secrets, configMaps, options.namespace);
      const propertiesFile = convertJsonToPropertiesFile(finalConfig);
      console.log(propertiesFile);
    }

    main().catch((err) => {
      logger.error('Invalid input! ', err);
      process.exit(-1);
    });
  });

prog.parse(process.argv);
