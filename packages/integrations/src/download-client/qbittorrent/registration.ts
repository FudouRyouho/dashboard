import { QbittorrentIntegration } from './qbittorrent-integration';
import type { IntegrationInput, IntegrationFactory, IntegrationMetadata } from '../../registry';

const metadata: IntegrationMetadata = {
  kind: 'qbittorrent',
  defaultPort: 8080,
  displayName: 'qBittorrent',
  description: 'BitTorrent client - download management',
  capabilities: ['downloadClient'],
};

const factory: IntegrationFactory = {
  metadata,
  create(input: IntegrationInput) {
    return new QbittorrentIntegration(input);
  },
};

import { registerIntegration } from '../../registry';
registerIntegration(factory);