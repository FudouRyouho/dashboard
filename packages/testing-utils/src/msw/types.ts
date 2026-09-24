import type { IntegrationKind } from '@dashboard/contracts';

/**
 * Base config shared by all MSW handler configs.
 */
export interface BaseHandlerConfig {
  kind: IntegrationKind;
  id: string;
  url: string;
  port: number;
}

/**
 * Union of all handler config types.
 */
export type HandlerConfig =
  | (BaseHandlerConfig & {
      apiKey?: string;
      responses?: {
        calendar?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty';
      };
    })
  | (BaseHandlerConfig & {
      apiKey?: string;
      responses?: {
        items?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty';
      };
    })
  | (BaseHandlerConfig & {
      responses?: {
        containers?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty';
        volumes?: 'success' | 'error_500' | 'empty';
        networks?: 'success' | 'error_500' | 'empty';
      };
    })
  | (BaseHandlerConfig & {
      username?: string;
      password?: string;
      responses?: {
        torrents?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty';
        appVersion?: 'success' | 'error_401' | 'error_500';
      };
    })
  | (BaseHandlerConfig & {
      responses?: {
        query?: 'success' | 'error_401' | 'error_500' | 'malformed' | 'empty';
        labelValues?: 'success' | 'error_500' | 'empty';
      };
    });