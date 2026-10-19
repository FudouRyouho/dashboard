import type { ServerMetrics } from '@dashboard/integrations';

export const systemHealthMock: ServerMetrics[] = [
  {
    server: '192.168.10.197',
    cpu: {
      usagePercent: 24.5,
      temperatureCelsius: 48.2,
    },
    memory: {
      totalBytes: 33_689_976_832,    // 32 GB
      availableBytes: 18_450_123_456, // ~18.4 GB available
      usagePercent: 45.2,
    },
    disks: [
      {
        mountpoint: '/',
        totalBytes: 1_900_000_000_000,   // 1.9 TB
        availableBytes: 1_250_000_000_000, // 1.25 TB free
        usagePercent: 34.2,
        readBytesPerSec: 125_000,
        writeBytesPerSec: 2_400_000,
        fstype: 'ext4',
        isSystemMount: true,
      },
      {
        mountpoint: '/mnt/media',
        totalBytes: 16_000_000_000_000,   // 16 TB
        availableBytes: 3_800_000_000_000, // 3.8 TB free
        usagePercent: 76.25,
        readBytesPerSec: 28_000_000,
        writeBytesPerSec: 45_000_000,
        fstype: 'xfs',
        isSystemMount: false,
      },
    ],
    network: [
      {
        device: 'eth0',
        rxBytesPerSec: 32_500_000, // ~32.5 MB/s incoming (descargas)
        txBytesPerSec: 4_100_000,  // ~4.1 MB/s outgoing (seeding)
      },
    ],
    sensors: [
      {
        sensorId: 'coretemp_package_id_0',
        chip: 'coretemp',
        tempCelsius: 48.2,
      },
      {
        sensorId: 'nvme_composite',
        chip: 'nvme',
        tempCelsius: 39.0,
      },
    ],
  },
  {
    server: '192.168.10.125',
    cpu: {
      usagePercent: 12.1,
      temperatureCelsius: 42.0,
    },
    memory: {
      totalBytes: 16_840_000_000,    // 16 GB
      availableBytes: 11_200_000_000,
      usagePercent: 33.5,
    },
    disks: [
      {
        mountpoint: '/',
        totalBytes: 950_000_000_000,     // 950 GB
        availableBytes: 620_000_000_000,
        usagePercent: 34.7,
        readBytesPerSec: 45_000,
        writeBytesPerSec: 180_000,
        fstype: 'ext4',
        isSystemMount: true,
      },
    ],
    network: [
      {
        device: 'eth0',
        rxBytesPerSec: 1_200_000,
        txBytesPerSec: 850_000,
      },
    ],
    sensors: [
      {
        sensorId: 'coretemp_package_id_0',
        chip: 'coretemp',
        tempCelsius: 42.0,
      },
    ],
  },
];
