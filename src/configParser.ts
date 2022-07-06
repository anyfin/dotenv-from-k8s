import fs from 'fs';
import yaml from 'js-yaml';
import util from 'util';

const readFile = util.promisify(fs.readFile);

export async function configParser(inputFile: string): Promise<Result> {
  const rawConfig = await readFile(inputFile, { encoding: 'utf8' });
  const config = yaml.load(rawConfig) as InputConfig;
  const namespace = config.namespace || 'default';
  const overrides = config.overrides || {};

  return { refs: config.envFrom ?? [], namespace, overrides };
}

type Result = {
  refs: Array<Ref>;
  overrides: Record<string, string>;
  namespace: string;
};

type InputConfig = {
  namespace?: string;
  envFrom?: Array<Ref>;
  overrides?: Record<string, string>;
};

type SecretRef = {
  configMapRef?: never;
  secretRef: {
    name: string;
  };
};

type ConfigMapRef = {
  secretRef?: never;
  configMapRef: {
    name: string;
  };
};

export type Ref = ConfigMapRef | SecretRef;
