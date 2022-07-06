import * as k8s from '@kubernetes/client-node';

import { Ref } from './configParser';
import { base64DecodeObjectValues, substituteVariable } from './utils';

export function getK8sApi(context?: string): k8s.CoreV1Api {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  if (context) {
    kc.setCurrentContext(context);
  }
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
  refs: Ref[],
  overrides: Record<string, string>,
  namespace: string,
): Promise<Record<string, string>> {
  const allEnvs = await Promise.all(
    refs.map((ref) => {
      if (ref.secretRef) {
        return getSecret(k8sApi, ref.secretRef.name, namespace).catch(() => ({}));
      }
      if (ref.configMapRef) {
        return getConfigMap(k8sApi, ref.configMapRef.name, namespace).catch(() => ({}));
      }
    }),
  );
  const variables: Record<string, string> = Object.assign({}, ...allEnvs, overrides);
  Object.keys(variables).forEach((key) => {
    // For each value in the variables run a pattern substitution for $(SOME_VAR)
    variables[key] = substituteVariable(variables[key], variables) ?? '';
  });
  return variables;
}
