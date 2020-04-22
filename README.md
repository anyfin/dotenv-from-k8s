# k8s2dotenv

A commandline cli tool to fetch, merge and convert secrets and config maps in k8s to dot env property file. 
Useful for building frontend projects for k8s.


This tool uses kubernetes apis via the official [kubernetes client for javascript](https://github.com/kubernetes-client/javascript)

This tool will use your currently configured kubectl to perform necessary api calls. So make sure you have configured your kubectl correctly before running this.

## Installation

```sh
npm install -g k8s2dotenv
```

## Usage

```s

   k8s2dotenv 1.0.0 - Merges and coverts secrets and configmaps to a env properties file

   USAGE

     k8s2dotenv

   OPTIONS

     -s, --secret <secret_name>        K8s <secret_name> from which you want to generate env file                         optional
     -c, --configmap <config_map>      K8s <config_map> from which you want to generate env file                          optional
     -n, --namespace <name_space>      K8s <name_space> from which you want to access the secrets and/or config maps      optional

   GLOBAL OPTIONS

     -h, --help         Display help
     -V, --version      Display version
     --no-color         Disable colors
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages

```

## Example

**Simple**

```
k8s2dotenv -c api-config > .env
```

**Advanced**

```
k8s2dotenv -s api-secrets -s api-secrets2 -c api-config -c api-config2 -n default > .env
```


## Alternatives

If you do not want to use this tool for some reason you can try

PS: You will need [`jq`](https://github.com/stedolan/jq) version 1.6+ installed on your system.

```sh
  kubectl get secrets/api-secrets -o json | \
      jq -r '.data | map_values(@base64d) | to_entries[] | "\(.key)=\(.value)"' > .env
  
  kubectl get configmaps/api-config -o json | \
    jq -r '.data | to_entries[] | "\(.key)=\(.value)"' >> .env
```
