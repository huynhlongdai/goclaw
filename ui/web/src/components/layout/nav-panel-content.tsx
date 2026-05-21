import {
  History,
  Inbox,
  Contact,
  Zap,
  Package,
  Plug,
  Volume2,
  Clock,
  Webhook,
  Brain,
  FileArchive,
  Network,
  HardDrive,
  Radio,
  Link,
  Activity,
  Radar,
  ClipboardList,
  Terminal,
  Cpu,
  KeyRound,
  Blocks,
  Settings,
  Building2,
  ShieldCheck,
  ArrowLeftRight,
  DatabaseBackup,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { PanelNavItem, PanelNavGroup } from "./panel-nav-item";
import { ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTenants } from "@/hooks/use-tenants";
import { usePendingPairingsCount } from "@/hooks/use-pending-pairings-count";
import type { NavSectionId } from "./nav-rail";

interface NavPanelContentProps {
  sectionId: NavSectionId;
}

export function NavPanelContent({ sectionId }: NavPanelContentProps) {
  const { t } = useTranslation("sidebar");
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin" || role === "owner";
  const { isOwner } = useTenants();
  const { pendingCount } = usePendingPairingsCount();

  if (sectionId === "capabilities") {
    return (
      <nav className="overflow-y-auto px-2 py-2 scrollbar-none">
        <PanelNavGroup label={t("groups.conversations")}>
          <PanelNavItem to={ROUTES.SESSIONS} icon={History} label={t("nav.sessions")} />
          <PanelNavItem to={ROUTES.PENDING_MESSAGES} icon={Inbox} label={t("nav.pendingMessages")} />
          <PanelNavItem to={ROUTES.CONTACTS} icon={Contact} label={t("nav.contacts")} />
        </PanelNavGroup>

        <PanelNavGroup label={t("groups.capabilities")}>
          <PanelNavItem to={ROUTES.SKILLS} icon={Zap} label={t("nav.skills")} />
          <PanelNavItem to={ROUTES.BUILTIN_TOOLS} icon={Package} label={t("nav.builtinTools")} />
          <PanelNavItem to={ROUTES.MCP} icon={Plug} label={t("nav.mcpServers")} />
          {isOwner && (
            <PanelNavItem to={ROUTES.TTS} icon={Volume2} label={t("nav.tts")} />
          )}
          <PanelNavItem to={ROUTES.CRON} icon={Clock} label={t("nav.cron")} />
          <PanelNavItem to={ROUTES.HOOKS} icon={Webhook} label={t("nav.hooks")} />
        </PanelNavGroup>
      </nav>
    );
  }

  if (sectionId === "data") {
    return (
      <nav className="overflow-y-auto px-2 py-2 scrollbar-none">
        <PanelNavGroup label={t("groups.data")}>
          <PanelNavItem to={ROUTES.MEMORY} icon={Brain} label={t("nav.memory")} />
          <PanelNavItem to={ROUTES.VAULT} icon={FileArchive} label={t("nav.vault")} />
          <PanelNavItem to={ROUTES.KNOWLEDGE_GRAPH} icon={Network} label={t("nav.knowledgeGraph")} />
          <PanelNavItem to={ROUTES.STORAGE} icon={HardDrive} label={t("nav.storage")} />
        </PanelNavGroup>
      </nav>
    );
  }

  if (sectionId === "channels") {
    return (
      <nav className="overflow-y-auto px-2 py-2 scrollbar-none">
        <PanelNavGroup label={t("groups.connectivity")}>
          <PanelNavItem to={ROUTES.CHANNELS} icon={Radio} label={t("nav.channels")} />
          <PanelNavItem to={ROUTES.NODES} icon={Link} label={t("nav.nodes")} badge={pendingCount} />
        </PanelNavGroup>
      </nav>
    );
  }

  if (sectionId === "monitoring") {
    return (
      <nav className="overflow-y-auto px-2 py-2 scrollbar-none">
        <PanelNavGroup label={t("groups.monitoring")}>
          <PanelNavItem to={ROUTES.TRACES} icon={Activity} label={t("nav.traces")} />
          <PanelNavItem to={ROUTES.EVENTS} icon={Radar} label={t("nav.realtimeEvents")} />
          <PanelNavItem to={ROUTES.ACTIVITY} icon={ClipboardList} label={t("nav.activity")} />
          <PanelNavItem to={ROUTES.LOGS} icon={Terminal} label={t("nav.logs")} />
        </PanelNavGroup>
      </nav>
    );
  }

  if (sectionId === "admin" && isAdmin) {
    return (
      <nav className="overflow-y-auto px-2 py-2 scrollbar-none">
        <PanelNavGroup label={t("groups.system")}>
          {isOwner && (
            <PanelNavItem to={ROUTES.TENANTS} icon={Building2} label={t("nav.tenants")} />
          )}
          <PanelNavItem to={ROUTES.PROVIDERS} icon={Cpu} label={t("nav.providers")} />
          <PanelNavItem to={ROUTES.CLI_CREDENTIALS} icon={KeyRound} label={t("nav.cliCredentials")} />
          <PanelNavItem to={ROUTES.API_KEYS} icon={KeyRound} label={t("nav.apiKeys")} />
          <PanelNavItem to={ROUTES.PACKAGES} icon={Blocks} label={t("nav.packages")} />
          {isOwner && (
            <PanelNavItem to={ROUTES.CONFIG} icon={Settings} label={t("nav.config")} />
          )}
          <PanelNavItem to={ROUTES.APPROVALS} icon={ShieldCheck} label={t("nav.approvals")} />
          <PanelNavItem to={ROUTES.IMPORT_EXPORT} icon={ArrowLeftRight} label={t("nav.importExport")} />
          {isOwner && (
            <PanelNavItem to={ROUTES.BACKUP_RESTORE} icon={DatabaseBackup} label={t("nav.backupRestore")} />
          )}
        </PanelNavGroup>
      </nav>
    );
  }

  return null;
}
