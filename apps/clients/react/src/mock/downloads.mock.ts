import type { DownloadClientJobsAndStatus } from '@dashboard/contracts';

export const downloadsMock: DownloadClientJobsAndStatus = {
  status: {
    paused: false,
    queueState: 'running',
    rates: {
      down: 45_250_000, // ~45.2 MB/s
      up: 5_120_000,    // ~5.1 MB/s
    },
    types: ['torrent'],
  },
  items: [
    {
      type: 'torrent',
      id: 'a1b2c3d4e5f67890123456789abcdef012345678',
      name: 'Avatar.Aang.El.Ultimo.Aire.2026.2160p.UHD.Remux.DV.HDR10.Atmos-FraMeSToR',
      size: 58_450_000_000, // 58.4 GB
      sent: 12_300_000_000,
      downSpeed: 28_400_000, // 28.4 MB/s
      upSpeed: 2_100_000,
      time: 640, // ~10 min approx restantes
      added: 1729300000,
      state: 'leeching',
      progress: 0.68,
      category: 'radarr',
    },
    {
      type: 'torrent',
      id: 'b2c3d4e5f67890123456789abcdef0123456789a',
      name: 'Bleach.S17E41.THE.BLADE.1080p.CR.WEB-DL.DDP2.0.H.264-VARYG',
      size: 1_450_000_000, // 1.45 GB
      sent: 450_000_000,
      downSpeed: 16_850_000, // 16.8 MB/s
      upSpeed: 1_820_000,
      time: 35, // 35 segundos restantes
      added: 1729305000,
      state: 'leeching',
      progress: 0.89,
      category: 'sonarr',
    },
    {
      type: 'torrent',
      id: 'c3d4e5f67890123456789abcdef0123456789ab',
      name: 'Cyberpunk.Edgerunners.S01.COMPLETE.2160p.NF.WEB-DL.DDP5.1.HDR.H.265-FLUX',
      size: 24_800_000_000,
      sent: 49_600_000_000, // Ratio 2.0
      downSpeed: 0,
      upSpeed: 1_200_000,
      time: 0,
      added: 1729100000,
      state: 'seeding',
      progress: 1.0,
      category: 'sonarr',
    },
    {
      type: 'torrent',
      id: 'd4e5f67890123456789abcdef0123456789abc',
      name: 'Ubuntu-26.04-desktop-amd64.iso',
      size: 4_200_000_000,
      sent: 0,
      downSpeed: 0,
      upSpeed: 0,
      time: 0,
      added: 1729000000,
      state: 'paused',
      progress: 0.42,
      category: 'isos',
    },
  ],
};