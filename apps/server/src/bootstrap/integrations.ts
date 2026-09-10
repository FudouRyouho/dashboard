import {
  Integration,
  IntegrationInput,
  RadarrIntegration,
  SonarrIntegration,
  JellyfinIntegration,
  DockerIntegration,
} from '@dashboard/integrations';
import { Config } from '../config';

type IntegrationConfig = Config['integrations'][number];

export interface RegistryEntry {
  integration: Integration;
  config: IntegrationConfig;
}

const toInput = (config: IntegrationConfig): IntegrationInput => {
  const secrets: { kind: string; value: string }[] = 'apiKey' in config
    ? [{ kind: 'apiKey', value: config.apiKey ?? '' }]
    : [];
  return {
    kind: config.kind,
    id: config.id,
    name: config.name,
    url: config.url,
    port: config.port,
    externalUrl: config.externalUrl,
    timeoutMs: config.timeoutMs,
    secrets,
  };
};

const instantiate = (config: IntegrationConfig): Integration => {
  switch (config.kind) {
    case 'sonarr':
      return new SonarrIntegration(toInput(config));
    case 'radarr':
      return new RadarrIntegration(toInput(config));
    case 'jellyfin':
      return new JellyfinIntegration(toInput(config));
    case 'docker':
      return new DockerIntegration(toInput(config));
  }
};

export const createIntegrationRegistry = (appConfig: Config): RegistryEntry[] =>
  appConfig.integrations.map((config) => ({
    integration: instantiate(config),
    config,
  }));
