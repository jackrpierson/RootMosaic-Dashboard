import { Container, Group, Text, Badge, Button, Menu, Avatar, ActionIcon } from '@mantine/core';
import { IconSettings, IconBell, IconChevronDown, IconDashboard, IconReportAnalytics, IconUser } from '@tabler/icons-react';

export default function DashboardHeader() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 animate-slide-up">
      <Container size="xl" py="md">
        <Group justify="space-between" align="center">
          {/* Logo and Title */}
          <Group gap="lg">
            <div className="relative">
              <div className="w-12 h-12 bg-enterprise rounded-xl flex items-center justify-center shadow-lg">
                <IconDashboard size={24} className="text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-success-gradient rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <Group gap="sm" align="center">
                <Text 
                  size="xl" 
                  fw={700} 
                  className="text-enterprise-h2 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
                >
                  RootMosaic
                </Text>
                <Badge 
                  variant="gradient" 
                  gradient={{ from: 'blue', to: 'purple' }}
                  size="sm"
                  className="animate-scale-in"
                >
                  Enterprise
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" className="text-enterprise-caption">
                AI-Powered Process Analytics & Optimization Platform
              </Text>
            </div>
          </Group>

          {/* Action Buttons */}
          <Group gap="sm">
            {/* Notifications */}
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              className="hover:bg-slate-100 transition-colors duration-200"
            >
              <IconBell size={20} />
            </ActionIcon>

            {/* Settings Menu */}
            <Menu shadow="lg" width={200} position="bottom-end">
              <Menu.Target>
                <Button
                  variant="subtle"
                  color="gray"
                  rightSection={<IconChevronDown size={16} />}
                  className="hover:bg-slate-100 transition-all duration-200"
                >
                  <Group gap="xs">
                    <Avatar size="sm" color="blue">
                      <IconUser size={16} />
                    </Avatar>
                    <Text size="sm" fw={500}>Admin</Text>
                  </Group>
                </Button>
              </Menu.Target>

              <Menu.Dropdown className="glass">
                <Menu.Label>Application</Menu.Label>
                <Menu.Item leftSection={<IconReportAnalytics size={16} />}>
                  Analytics
                </Menu.Item>
                <Menu.Item leftSection={<IconSettings size={16} />}>
                  Settings
                </Menu.Item>
                
                <Menu.Divider />
                
                <Menu.Label>Account</Menu.Label>
                <Menu.Item color="red">
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            {/* Status Indicator */}
            <Group gap="xs" className="px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <Text size="xs" c="green.7" fw={500}>
                Live Data
              </Text>
            </Group>
          </Group>
        </Group>

        {/* Secondary Navigation */}
        <Group mt="sm" gap="xs" className="border-t border-slate-100 pt-3">
          <Badge variant="light" color="blue" size="sm">
            3,000 Records Analyzed
          </Badge>
          <Badge variant="light" color="green" size="sm">
            Real-time Sync Active
          </Badge>
          <Badge variant="light" color="orange" size="sm">
            5 Process Improvements Detected
          </Badge>
        </Group>
      </Container>
    </header>
  );
} 