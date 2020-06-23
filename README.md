# dotenv-from-k8s

A commandline cli tool to fetch, merge and convert secrets and config maps in k8s to dot env property file.

In most frontend projects environment variables are built as part of docker build. This tool allows you to create a .env file from k8s secrets and config maps before doing a docker build. This way you can store your secrets in k8s secrets just like you would for a nodejs service.

This tool uses kubernetes apis via the official [kubernetes client for javascript](https://github.com/kubernetes-client/javascript) and
will use your currently configured kubectl to perform necessary api calls. So make sure you have configured your kubectl correctly before running this.

## Installation

```sh
npm install -g dotenv-from-k8s
```

## Usage

```s

   dotenv-from-k8s 1.3.0 - A commandline cli tool to fetch, merge and convert secrets and config maps in k8s to dot env property file.

   USAGE

     dotenv-from-k8s

   OPTIONS

     -i, --input                       Input configuration file                                                           optional      default: false
     -o, --out                         Output env file name, defaults to stdout                                           optional      default: false
     -s, --secret <secret_name>        K8s <secret_name> from which you want to generate env file                         optional
     -c, --configmap <config_map>      K8s <config_map> from which you want to generate env file                          optional
     -n, --namespace <name_space>      K8s <name_space> from which you want to access the secrets and/or config maps      optional

   MORE INFO


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


   GLOBAL OPTIONS

     -h, --help         Display help
     -V, --version      Display version
     --no-color         Disable colors
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages


```

## Example

### Basic example:

`dotenv-from-k8s -c api-config -o .env`
or
`dotenv-from-k8s -c api-config > .env`

### Advanced example:

`dotenv-from-k8s -s api-secrets -s api-secrets2 -c api-config -c api-config2 -n default > .env`

### Config file example:

**env-from.yaml**

```
namespace: default
envFrom:
  - secretRef:
      name: app-secrets
  - configMapRef:
      name: app-config
overrides:
    Hello: World
```

`dotenv-from-k8s -i env-from.yaml -o .env`

## Alternatives

If you do not want to use this tool for some reason you can try

PS: You will need [`jq`](https://github.com/stedolan/jq) version 1.6+ installed on your system.

```sh
  kubectl get secrets/api-secrets -o json | \
      jq -r '.data | map_values(@base64d) | to_entries[] | "\(.key)=\(.value)"' > .env

  kubectl get configmaps/api-config -o json | \
    jq -r '.data | to_entries[] | "\(.key)=\(.value)"' >> .env
```
