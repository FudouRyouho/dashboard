import { JellyfinIntegration } from './jellyfin-integration';
import type {
  IntegrationInput,
  IntegrationFactory,
  IntegrationMetadata,
} from '../registry';

const metadata: IntegrationMetadata = {
  kind: 'jellyfin',
  defaultPort: 8096,
  displayName: 'Jellyfin',
  description: 'Media playback and releases',
  capabilities: ['mediaReleases'],
};

const factory: IntegrationFactory = {
  metadata,
  create(input: IntegrationInput) {
    return new JellyfinIntegration(input);
  },
};

import { registerIntegration } from '../registry';
registerIntegration(factory);
