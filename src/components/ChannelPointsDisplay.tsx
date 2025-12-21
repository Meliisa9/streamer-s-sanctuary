import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChannelPoints } from "@/hooks/useChannelPoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Coins,
  RefreshCw,
  Link2,
  Unlink,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Platform icons (inline SVGs for Twitch and Kick)
const TwitchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
  </svg>
);

const KickIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M1.333 0v24h21.334V0H1.333Zm17.067 18.133h-4.267L9.6 12.8v5.333H6.4V5.867h3.2v5.066l4.267-5.066h4.267l-4.8 5.6 5.066 6.666Z" />
  </svg>
);

interface ChannelPointsDisplayProps {
  showConnections?: boolean;
  compact?: boolean;
  variant?: "default" | "compact";
  showConnectButtons?: boolean;
}

export function ChannelPointsDisplay({ 
  showConnections = true, 
  compact = false,
  variant = "default",
  showConnectButtons = false,
}: ChannelPointsDisplayProps) {
  // If variant is compact, override compact prop
  const isCompact = variant === "compact" || compact;
  const {
    points,
    connections,
    isLoading,
    syncPoints,
    isSyncing,
    connectTwitch,
    connectKick,
    disconnect,
    isDisconnecting,
    isConnected,
    getConnection,
  } = useChannelPoints();

  const [disconnectPlatform, setDisconnectPlatform] = useState<"twitch" | "kick" | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        {showConnections && (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        )}
      </div>
    );
  }

  const platformConfigs = [
    {
      id: "site" as const,
      name: "Site Points",
      icon: <Coins className="w-5 h-5 text-yellow-500" />,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
    },
    {
      id: "twitch" as const,
      name: "Twitch Points",
      icon: <TwitchIcon className="w-5 h-5 text-purple-500" />,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      id: "kick" as const,
      name: "Kick Points",
      icon: <KickIcon className="w-5 h-5 text-green-500" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
  ];

  if (isCompact) {
    return (
      <div className="inline-flex flex-wrap items-center gap-3 px-5 py-3 rounded-2xl bg-card border border-border shadow-lg">
        {platformConfigs.map((platform) => {
          const balance = points[platform.id];
          const connected = platform.id === "site" || isConnected(platform.id as "twitch" | "kick");

          return (
            <div
              key={platform.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${platform.bgColor} ${platform.borderColor}`}
            >
              {platform.icon}
              <div className="flex items-center gap-1">
                <span className="font-bold">{balance.toLocaleString()}</span>
                {platform.id !== "site" && !connected && showConnectButtons && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs h-auto p-0 ml-1"
                    onClick={platform.id === "twitch" ? connectTwitch : connectKick}
                  >
                    Connect
                  </Button>
                )}
                {platform.id !== "site" && !connected && !showConnectButtons && (
                  <Badge variant="outline" className="text-xs ml-1">Not linked</Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Points Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Your Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {platformConfigs.map((platform) => {
              const balance = points[platform.id];
              const connection = platform.id !== "site" ? getConnection(platform.id) : null;
              const connected = platform.id === "site" || isConnected(platform.id as "twitch" | "kick");

              return (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border ${platform.bgColor} ${platform.borderColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {platform.icon}
                      <span className="text-sm font-medium">{platform.name}</span>
                    </div>
                    {platform.id !== "site" && connected && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => syncPoints(platform.id as "twitch" | "kick")}
                        disabled={isSyncing}
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                      </Button>
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${platform.color}`}>
                    {balance.toLocaleString()}
                  </p>
                  {platform.id !== "site" && connection?.lastSynced && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last synced: {new Date(connection.lastSynced).toLocaleString()}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connections */}
      {showConnections && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Platform Connections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Twitch Connection */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <TwitchIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">Twitch</p>
                  {isConnected("twitch") ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Connected as {getConnection("twitch")?.username}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>
              {isConnected("twitch") ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDisconnectPlatform("twitch")}
                  disabled={isDisconnecting}
                >
                  <Unlink className="w-4 h-4 mr-1" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectTwitch}
                  className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Connect
                </Button>
              )}
            </div>

            {/* Kick Connection */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <KickIcon className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Kick</p>
                  {isConnected("kick") ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Connected as {getConnection("kick")?.username}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>
              {isConnected("kick") ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDisconnectPlatform("kick")}
                  disabled={isDisconnecting}
                >
                  <Unlink className="w-4 h-4 mr-1" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectKick}
                  className="border-green-500/50 text-green-600 hover:bg-green-500/10"
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Connect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disconnect Confirmation */}
      <AlertDialog open={!!disconnectPlatform} onOpenChange={() => setDisconnectPlatform(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectPlatform}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to your {disconnectPlatform} account. 
              Your points balance will be reset. You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (disconnectPlatform) {
                  disconnect(disconnectPlatform);
                  setDisconnectPlatform(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDisconnecting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Unlink className="w-4 h-4 mr-1" />
              )}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
