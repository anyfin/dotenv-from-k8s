import fs from 'fs';
import yaml from 'js-yaml';
import util from 'util';

const readFile = util.promisify(fs.readFile);

export async function configParser(inputFile: string): Promise<Result> {
  const rawConfig = await readFile(inputFile, { encoding: 'utf8' });
  const config = yaml.safeLoad(rawConfig) as InputConfig;
  const secrets: string[] = [];
  const configMaps: string[] = [];
  const namespace = config.namespace || 'default';
  const overrides = config.overrides || {};
  config.envFrom?.forEach((ref: any) => {
    if (ref.secretRef) {
      secrets.push(ref.secretRef.name);
    } else if (ref.configMapRef) {
      configMaps.push(ref.configMapRef.name);
    }
  });

  return { secrets, configMaps, namespace, overrides };
}

type Result = {
  secrets: Array<string>;
  configMaps: Array<string>;
  overrides: Record<string, string>;
  namespace: string;
};

type InputConfig = {
  namespace?: string;
  envFrom?: Array<ConfigMapRef | SecretRef>;
  overrides?: Record<string, string>;
};

type SecretRef = {
  secretRef: {
    name: string;
  };
};

type ConfigMapRef = {
  configMapRef: {
    name: string;
  };
};
