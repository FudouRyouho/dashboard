/**
 * Section: System Health (CPU, RAM, Discos, Red, Sensores)
 *
 * REFERENCE:
 * - Guide: .working/homarr-research/ui-components-guide.md §4
 * - Homarr: references/homarr/packages/widgets/src/health-monitoring/system-health.tsx
 *   y rings/cpu-ring.tsx, rings/memory-ring.tsx, rings/gpu-ring.tsx
 *
 * API (futura): systemHealth.getAllMetrics -> ServerMetrics[]
 * Mock: src/mock/system-health.mock.ts
 */
import {
  Badge,
  Box,
  Card,
  Divider,
  Group,
  Progress,
  RingProgress,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconCpu,
  IconDatabase,
  IconDeviceMobile,
  IconDownload,
  IconNetwork,
  IconServer,
  IconTemperature,
  IconThermometer,
  IconUpload,
} from '@tabler/icons-react';

import type { ServerMetrics } from '@dashboard/integrations';
import { formatBytes } from '@dashboard/core';

function progressColor(percentage: number): string {
  if (percentage < 40) return 'green';
  if (percentage < 60) return 'yellow';
  if (percentage < 90) return 'orange';
  return 'red';
}

function formatTemp(temp: number | null): string {
  if (temp === null) return '—';
  return temp.toFixed(1) + '°C';
}

function formatBytesPerSec(bytes: number | null): string {
  if (bytes === null) return '—';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < 3) {
    value /= 1024
    unitIndex++
  }
  return value.toFixed(1) + ' ' + units[unitIndex]
}

export function SystemHealthSection({ metrics }: { metrics: ServerMetrics[] }) {
  if (metrics.length === 0) {
    return (
      <Card withBorder p="md">
        <Stack gap="sm">
          <Text fw={600}>System Health</Text>
          <Text size="xs" c="dimmed">
            No metrics available (mock)
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card withBorder p="md">
      <Stack gap="sm">
        <Text fw={600}>System Health</Text>

        {metrics.map((metric) => (
          <Box key={metric.server} p="sm" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'md' }}>
            <Group justify="space-between" mb="sm">
              <Group gap="sm">
                <IconServer size={20} />
                <Text fw={600} size="lg">{metric.server}</Text>
              </Group>
              <Group gap="xs">
                <Badge size="xs" color="green">Online</Badge>
              </Group>
            </Group>

            {/* CPU & Memory rings */}
            <Group gap="md" wrap="wrap" mt="sm">
              {/* CPU Ring */}
              <Tooltip label={"CPU: " + (metric.cpu.usagePercent?.toFixed(1) ?? '—') + "%"} withArrow>
                <RingProgress
                  size={80}
                  thickness={6}
                  roundCaps
                  sections={[
                    {
                      value: metric.cpu.usagePercent ?? 0,
                      color: progressColor(metric.cpu.usagePercent ?? 0),
                    },
                  ]}
                  label={
                    <Stack gap={1} ta="center">
                      <Text size="xs" fw={600}>
                        {metric.cpu.usagePercent?.toFixed(1) ?? '—'}%
                      </Text>
                      <IconCpu size={14} color="dimmed" />
                    </Stack>
                  }
                />
              </Tooltip>

              {/* CPU Temp Ring */}
              {(() => {
                if (metric.cpu.temperatureCelsius === null) return null;
                const temp = metric.cpu.temperatureCelsius;
                const value = Math.min((temp ?? 0) / 100 * 100, 100);
                return (
                  <Tooltip label={"CPU Temp: " + formatTemp(temp)} withArrow>
                    <RingProgress
                      size={80}
                      thickness={6}
                      roundCaps
                      sections={[{ value, color: progressColor(value) }]}
                      label={
                        <Stack gap={1} ta="center">
                          <Text size="xs" fw={600}>{formatTemp(metric.cpu.temperatureCelsius)}</Text>
                          <IconTemperature size={14} color="dimmed" />
                        </Stack>
                      }
                  />
                </Tooltip>
              )})()}      {/* Memory Ring */}
              <Tooltip label={"RAM: " + (metric.memory.usagePercent?.toFixed(1) ?? '—') + "%"} withArrow>
                <RingProgress
                  size={80}
                  thickness={6}
                  roundCaps
                  sections={[
                    {
                      value: metric.memory.usagePercent ?? 0,
                      color: progressColor(metric.memory.usagePercent ?? 0),
                    },
                  ]}
                  label={
                    <Stack gap={1} ta="center">
                      <Text size="xs" fw={600}>
                        {metric.memory.usagePercent?.toFixed(1) ?? '—'}%
                      </Text>
                      <IconDatabase size={14} color="dimmed" />
                    </Stack>
                  }
                />
              </Tooltip>
            </Group>

            {/* Memory details */}
            <Group gap="md" mt="sm" wrap="wrap">
              <Tooltip label="Total RAM" withArrow>
                <Badge variant="light" color={progressColor(metric.memory.usagePercent ?? 0)}>
                  <Group gap={4}>
                    <IconDatabase size={14} />
                    <Text size="xs">{formatBytes(metric.memory.totalBytes ?? 0)}</Text>
                  </Group>
                </Badge>
              </Tooltip>
              <Tooltip label="Available RAM" withArrow>
                <Badge variant="light" color={progressColor((metric.memory.usagePercent ?? 0) > 0 ? 100 - (metric.memory.usagePercent ?? 0) : 0)}>
                  <Group gap={4}>
                    <IconDatabase size={14} />
                    <Text size="xs">{formatBytes(metric.memory.availableBytes ?? 0)}</Text>
                  </Group>
                </Badge>
              </Tooltip>
              <Tooltip label="RAM Usage" withArrow>
                <Badge variant="light" color={progressColor(metric.memory.usagePercent ?? 0)}>
                  <Group gap={4}>
                    <IconDatabase size={14} />
                    <Text size="xs">{metric.memory.usagePercent?.toFixed(1) ?? '—'}%</Text>
                  </Group>
                </Badge>
              </Tooltip>
            </Group>

            {/* CPU Details */}
            <Group gap="md" mt="sm" wrap="wrap">
              <Tooltip label="CPU Usage" withArrow>
                <Badge variant="light" color={progressColor(metric.cpu.usagePercent ?? 0)}>
                  <Group gap={4}>
                    <IconCpu size={14} />
                    <Text size="xs">{metric.cpu.usagePercent?.toFixed(1) ?? '—'}%</Text>
                  </Group>
                </Badge>
              </Tooltip>
              {metric.cpu.temperatureCelsius !== null && (
                <Tooltip label="CPU Temperature" withArrow>
                  <Badge variant="light" color={progressColor(metric.cpu.temperatureCelsius ?? 0)}>
                    <Group gap={4}>
                      <IconTemperature size={14} />
                      <Text size="xs">{formatTemp(metric.cpu.temperatureCelsius ?? 0)}</Text>
                    </Group>
                  </Badge>
                </Tooltip>
              )}
            </Group>

            {/* Disks */}
            {metric.disks.length > 0 && (
              <Box mt="sm">
                <Divider my="xs" />
                <Text size="xs" fw={600} c="dimmed">Disks</Text>
                <Stack gap="xs" mt="xs">
                  {metric.disks.map((disk) => (
                    <Box key={disk.mountpoint} p="xs" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'md' }}>
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <IconServer size={14} color="dimmed" />
                          <Text size="xs" fw={500}>{disk.mountpoint}</Text>
                          <Badge size="xs" variant="light" color={disk.isSystemMount ? 'blue' : 'gray'}>{disk.fstype}</Badge>
                        </Group>
                        <Group gap="xs">
                          <Badge size="xs" variant="dot" color={progressColor(disk.usagePercent ?? 0)}>
                            {disk.usagePercent?.toFixed(1) ?? '—'}%
                          </Badge>
                        </Group>
                      </Group>
                      <Progress.Root size="sm" radius="sm">
                        <Progress.Section
                          value={disk.usagePercent ?? 0}
                          color={progressColor(disk.usagePercent ?? 0)}
                        />
                        <Progress.Section value={100 - (disk.usagePercent ?? 0)} color="default" />
                      </Progress.Root>
                      <Group justify="space-between" mt="xs">
                        <Text size="xs" c="dimmed">
                          Used: {formatBytes(disk.totalBytes && disk.availableBytes ? (disk.totalBytes ?? 0) - (disk.availableBytes ?? 0) : 0)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Free: {formatBytes(disk.availableBytes ?? 0)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          R: {formatBytesPerSec(disk.readBytesPerSec)} W: {formatBytesPerSec(disk.writeBytesPerSec)}
                        </Text>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Network */}
            {metric.network.length > 0 && (
              <Box mt="sm">
                <Divider my="xs" />
                <Text size="xs" fw={600} c="dimmed">Network</Text>
                <Stack gap="xs" mt="xs">
                  {metric.network.map((net) => (
                    <Box key={net.device} p="xs" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'md' }}>
                      <Group justify="space-between">
                        <Group gap="xs">
                          <IconNetwork size={14} color="dimmed" />
                          <Text size="xs" fw={500}>{net.device}</Text>
                        </Group>
                        <Group gap="md">
                          <Tooltip label="Download" withArrow>
                            <Badge variant="light" color="blue">
                              <Group gap={4}>
                                <IconDownload size={12} />
                                <Text size="xs">{formatBytesPerSec(net.rxBytesPerSec)}</Text>
                              </Group>
                            </Badge>
                          </Tooltip>
                          <Tooltip label="Upload" withArrow>
                            <Badge variant="light" color="green">
                              <Group gap={4}>
                                <IconUpload size={12} />
                                <Text size="xs">{formatBytesPerSec(net.txBytesPerSec)}</Text>
                              </Group>
                            </Badge>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Sensors */}
            {metric.sensors.length > 0 && (
              <Box mt="sm">
                <Divider my="xs" />
                <Text size="xs" fw={600} c="dimmed">Sensors</Text>
                <Stack gap="xs" mt="xs">
                  {metric.sensors.map((sensor) => (
                    <Box key={sensor.sensorId} p="xs" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'md' }}>
                      <Group justify="space-between">
                        <Group gap="xs">
                          <IconDeviceMobile size={14} color="dimmed" />
                          <Text size="xs" fw={500}>{sensor.sensorId}</Text>
                          <Badge size="xs" variant="light" color="gray">{sensor.chip}</Badge>
                        </Group>
                        <Tooltip label="Temperature" withArrow>
                          <Badge variant="light" color={progressColor((sensor.tempCelsius ?? 0) / 100 * 100)}>
                            <Group gap={4}>
                              <IconThermometer size={12} />
                              <Text size="xs">{formatTemp(sensor.tempCelsius)}</Text>
                            </Group>
                          </Badge>
                        </Tooltip>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Network speed summary at bottom */}
            <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', marginTop: 'sm', paddingTop: 'sm' }}>
              <Group justify="space-between">
                <Group gap="md">
                  <Tooltip label="Total Download" withArrow>
                    <Group gap={4}>
                      <IconDownload size={14} color="blue" />
                      <Text size="xs" fw={600} color="blue">{formatBytesPerSec(metric.network.reduce((sum, n) => sum + (n.rxBytesPerSec ?? 0), 0))}</Text>
                    </Group>
                  </Tooltip>
                  <Tooltip label="Total Upload" withArrow>
                    <Group gap={4}>
                      <IconUpload size={14} color="green" />
                      <Text size="xs" fw={600} color="green">{formatBytesPerSec(metric.network.reduce((sum, n) => sum + (n.txBytesPerSec ?? 0), 0))}</Text>
                    </Group>
                  </Tooltip>
                </Group>
              </Group>
            </Box>
          </Box>
        ))}
      </Stack>
    </Card>
  )
}
