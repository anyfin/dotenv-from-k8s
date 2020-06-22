import * as k8s from '@kubernetes/client-node';

import { base64DecodeObjectValues } from './utils';

export function getK8sApi(): k8s.CoreV1Api {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  return kc.makeApiClient(k8s.CoreV1Api);
}

async function getSecret(
  k8sApi: k8s.CoreV1Api,
  secretName: string,
  namespace = 'default',
): Promise<Record<string, string>> {
  const res = await k8sApi.readNamespacedSecret(secretName, namespace);
  const secrets = res.body?.data || {};
  return base64DecodeObjectValues(secrets);
}

async function getConfigMap(
  k8sApi: k8s.CoreV1Api,
  configName: string,
  namespace = 'default',
): Promise<Record<string, string>> {
  const res = await k8sApi.readNamespacedConfigMap(configName, namespace);
  return res.body?.data || {};
}

export async function getAndMergeSecretsAndConfigs(
  k8sApi: k8s.CoreV1Api,
  secrets: string[],
  configMaps: string[],
  overrides: Record<string, string>,
  namespace: string,
): Promise<Record<string, string>> {
  const allSecrets = await Promise.all(
    secrets.map(async (secret) => {
      return getSecret(k8sApi, secret, namespace).catch(() => ({}));
    }),
  );
  const allConfigMaps = await Promise.all(
    configMaps.map(async (configMap) => {
      return getConfigMap(k8sApi, configMap, namespace).catch(() => ({}));
    }),
  );
  return Object.assign({}, ...allSecrets, ...allConfigMaps, overrides);
}
