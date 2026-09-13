import { PrometheusIntegration } from './prometheus-integration';
import type {
  IntegrationInput,
  IntegrationFactory,
  IntegrationMetadata,
} from '../registry';

const metadata: IntegrationMetadata = {
  kind: 'prometheus',
  defaultPort: 9090,
  displayName: 'Prometheus',
  description: 'System metrics via Prometheus + Node Exporter',
  capabilities: ['systemHealth'],
};

const factory: IntegrationFactory = {
  metadata,
  create(input: IntegrationInput) {
    return new PrometheusIntegration(input);
  },
};

import { registerIntegration } from '../registry';
registerIntegration(factory);