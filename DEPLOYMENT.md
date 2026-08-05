# Deploy admin-panel to OpenShift with GitHub Actions

This deployment follows the same OpenShift pattern as the supplied Python
application: GitHub Actions authenticates with `oc`, sends the repository to a
binary `BuildConfig`, stores the result in an internal `ImageStream`, applies
the runtime resources, waits for rollout, and smoke-tests the public Route.

The React application is built twice intentionally:

1. GitHub validates that a clean production build succeeds.
2. OpenShift performs the authoritative container build from the Dockerfile.

## GitHub environment and secrets

Create a GitHub environment named `staging`:

```text
Repository > Settings > Environments > New environment > staging
```

Add these environment secrets:

| Secret | Example |
| --- | --- |
| `OPENSHIFT_SERVER` | `https://api.cluster.example.com:6443` |
| `OPENSHIFT_TOKEN` | Token for the GitHub Actions service account |
| `OPENSHIFT_NAMESPACE` | `my-project` |

An exposed OpenShift image-registry route is not required. The image is built
inside OpenShift and stored in the cluster's integrated registry.

## OpenShift service account

Create a service account and grant it permission in the target namespace:

```bash
oc create serviceaccount github-actions -n <namespace>
oc policy add-role-to-user edit \
  system:serviceaccount:<namespace>:github-actions \
  -n <namespace>
oc create token github-actions -n <namespace> --duration=8760h
```

Use a token lifetime that complies with your organization's security policy.
Store the token only in the GitHub environment secret.

## Pipeline

Push to `main`, or run the workflow manually. It performs these operations:

1. Runs `npm ci` and validates `npm run build` with `CI=true`.
2. Installs OpenShift CLI 4.18 from the official Red Hat mirror.
3. Logs in and selects `OPENSHIFT_NAMESPACE`.
4. Applies the `ImageStream` and binary `BuildConfig`.
5. Runs `oc start-build --from-dir=.` and follows the build logs.
6. Applies the Deployment, Service and HTTPS Route.
7. Restarts the Deployment so the `latest` ImageStream image is pulled.
8. Waits for rollout and calls `https://<route>/healthz`.
9. Collects build, pod, event and application diagnostics after a failure.

## Existing test limitation

The repository's existing Jest test fails while loading the ESM version of a
Nivo/D3 dependency under Create React App 5. The deployment workflow validates
the production build but does not use that test as a gate. Fix or mock the Nivo
imports before adding `npm test -- --watchAll=false` to the workflow.

## Manual verification

```bash
oc get builds
oc get pods -l app=admin-panel
oc get deployment admin-panel
oc get route admin-panel
oc logs deployment/admin-panel --tail=200

export APP_URL="https://$(oc get route admin-panel -o jsonpath='{.spec.host}')"
curl --fail-with-body "$APP_URL/healthz"
```
